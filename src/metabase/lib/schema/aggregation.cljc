(ns metabase.lib.schema.aggregation
  (:require
   [metabase.lib.hierarchy :as lib.hierarchy]
   [metabase.lib.schema.expression :as expression]
   [metabase.lib.schema.mbql-clause :as mbql-clause]
   [metabase.util.i18n :as i18n]
   [metabase.util.malli.registry :as mr]))

;; count has an optional expression arg. This is the number of non-NULL values -- corresponds to count(<expr>) in SQL
(mbql-clause/define-catn-mbql-clause :count :- :type/Integer
  [:expression [:? [:schema [:ref ::expression/expression]]]])

;; cum-count has an optional expression arg
(mbql-clause/define-catn-mbql-clause :cum-count :- :type/Integer
  [:expression [:? [:schema [:ref ::expression/expression]]]])

(mbql-clause/define-tuple-mbql-clause :avg :- :type/Float
  [:schema [:ref ::expression/number]])

;;; number of distinct values of something.
(mbql-clause/define-tuple-mbql-clause :distinct :- :type/Integer
  [:schema [:ref ::expression/expression]])

(mbql-clause/define-tuple-mbql-clause :distinct-where :- :type/Integer
  [:schema [:ref ::expression/expression]]
  [:schema [:ref ::expression/boolean]])

(mbql-clause/define-tuple-mbql-clause :count-where :- :type/Integer
  [:schema [:ref ::expression/boolean]])

;;; min and max should work on anything orderable, including numbers, temporal values, and even text values.
(mbql-clause/define-tuple-mbql-clause :max
  [:schema [:ref ::expression/orderable]])

;;; check either the type of the first arg, or fall back to `:type/Number` is the type cannot be determined.
(lib.hierarchy/derive ::type-is-type-of-first-arg-or-number :lib.type-of/type-is-type-of-first-arg)

(defmethod expression/type-of-method ::type-is-type-of-first-arg-or-number
  [expr]
  (let [expr-type ((get-method expression/type-of-method :lib.type-of/type-is-type-of-first-arg) expr)]
    (if (= expr-type ::expression/type.unknown)
      :type/Number
      expr-type)))

(lib.hierarchy/derive :max ::type-is-type-of-first-arg-or-number)

;;; apparently median and percentile only work for numeric args in Postgres, as opposed to anything orderable. Not
;;; sure this makes sense conceptually, but since there probably isn't as much of a use case we can keep that
;;; restriction in MBQL for now.
(mbql-clause/define-tuple-mbql-clause :median
  [:schema [:ref ::expression/number]])

(lib.hierarchy/derive :median ::type-is-type-of-first-arg-or-number)

(mbql-clause/define-tuple-mbql-clause :min
  [:schema [:ref ::expression/orderable]])

(lib.hierarchy/derive :min ::type-is-type-of-first-arg-or-number)

(mr/def ::percentile.percentile
  [:and
   {:error/message "valid percentile"}
   [:ref ::expression/number]
   [:fn
    {:error/message "percentile must be between zero and one"}
    #(<= 0 % 1)]])

(mbql-clause/define-tuple-mbql-clause :percentile
  #_expr       [:ref ::expression/number]
  #_percentile [:ref ::percentile.percentile])

(lib.hierarchy/derive :percentile ::type-is-type-of-first-arg-or-number)

(mbql-clause/define-tuple-mbql-clause :share :- :type/Float
  [:schema [:ref ::expression/boolean]])

(mbql-clause/define-tuple-mbql-clause :stddev :- :type/Float
  [:schema [:ref ::expression/number]])

(mbql-clause/define-tuple-mbql-clause :sum
  [:schema [:ref ::expression/number]])

(mbql-clause/define-tuple-mbql-clause :cum-sum
  [:schema [:ref ::expression/number]])

(lib.hierarchy/derive :sum ::type-is-type-of-first-arg-or-number)

(lib.hierarchy/derive :cum-sum ::type-is-type-of-first-arg-or-number)

(mbql-clause/define-tuple-mbql-clause :sum-where
  [:schema [:ref ::expression/number]]
  [:schema [:ref ::expression/boolean]])

(lib.hierarchy/derive :sum-where ::type-is-type-of-first-arg-or-number)

(mbql-clause/define-tuple-mbql-clause :var :- :type/Float
  #_expr [:schema [:ref ::expression/number]])

(doseq [tag [:aggregation
             :avg
             :count
             :cum-count
             :count-where
             :distinct
             :distinct-where
             :max
             :median
             :min
             :offset
             :percentile
             :share
             :stddev
             :sum
             :cum-sum
             :sum-where
             :var
             :metric]]
  (lib.hierarchy/derive tag ::aggregation-clause-tag))

(defn- aggregation-expression?
  "A clause is a valid aggregation if it is an aggregation clause, or it is an expression that transitively contains
  a single aggregation clause."
  [x]
  (when-let [[tag _opts & args] (and (vector? x) x)]
    (or (lib.hierarchy/isa? tag ::aggregation-clause-tag)
        ;; Case has the following shape [:case opts [[cond expr]...] default-expr?]
        (if (= :case tag)
          (or (some aggregation-expression? (ffirst args))
              (some aggregation-expression? (fnext args)))
          (some aggregation-expression? args)))))

(mr/def ::aggregation
  [:and
   [:ref :metabase.lib.schema.mbql-clause/clause]
   [:fn
    {:error/message "Valid aggregation clause"}
    aggregation-expression?]])

(mr/def ::aggregations
  [:sequential {:min 1} [:ref ::aggregation]])

(def aggregation-operators
  "The list of available aggregation operator.
  The order of operators is relevant for the front end."
  [{:short            :count
    :requires-column? false
    :driver-feature   :basic-aggregations
    :display-info     (fn []
                        {:display-name (i18n/tru "Número de filas")
                         :column-name  (i18n/tru "Contar")
                         :description  (i18n/tru "Total de filas en la respuesta.")})}
   {:short            :sum
    :supported-field  :metabase.lib.types.constants/summable
    :requires-column? true
    :driver-feature   :basic-aggregations
    :display-info     (fn []
                        {:display-name (i18n/tru "Suma de ...")
                         :column-name  (i18n/tru "Suma")
                         :description  (i18n/tru "Suma de todos los valores de una columna.")})}
   {:short            :avg
    :supported-field  :metabase.lib.types.constants/summable
    :requires-column? true
    :driver-feature   :basic-aggregations
    :display-info     (fn []
                        {:display-name (i18n/tru "Promedio de ...")
                         :column-name  (i18n/tru "Media")
                         :description  (i18n/tru "Promedio de todos los valores de una columna")})}
   {:short            :median
    :supported-field  :metabase.lib.types.constants/summable
    :requires-column? true
    :driver-feature   :percentile-aggregations
    :display-info     (fn []
                        {:display-name (i18n/tru "Mediana de ...")
                         :column-name  (i18n/tru "Mediana")
                         :description  (i18n/tru "Mediana de todos los valores de una columna")})}
   {:short            :distinct
    :supported-field  :any
    :requires-column? true
    :driver-feature   :basic-aggregations
    :display-info     (fn []
                        {:display-name (i18n/tru "Number of distinct values of ...")
                         :column-name  (i18n/tru "Distinct values")
                         :description  (i18n/tru "Number of unique values of a column among all the rows in the answer.")})}
   {:short            :cum-sum
    :supported-field  :metabase.lib.types.constants/summable
    :requires-column? true
    :driver-feature   :basic-aggregations
    :display-info     (fn []
                        {:display-name (i18n/tru "Suma acumulativa de ...")
                         :column-name  (i18n/tru "Suma")
                         :description  (i18n/tru "Suma aditiva de todos los valores de una columna.\ne.x. ingresos totales a lo largo del tiempo.")})}
   {:short            :cum-count
    :requires-column? false
    :driver-feature   :basic-aggregations
    :display-info     (fn []
                        {:display-name (i18n/tru "Conteo acumulativo de filas")
                         :column-name  (i18n/tru "Contar")
                         :description  (i18n/tru "Conteo aditivo del número de filas.\ne.x. total de ventas a lo largo del tiempo.")})}
   {:short            :stddev
    :supported-field  :metabase.lib.types.constants/summable
    :requires-column? true
    :driver-feature   :standard-deviation-aggregations
    :display-info     (fn []
                        {:display-name (i18n/tru "Desviación estándar de ...")
                         :column-name  (i18n/tru "SD")
                         :description  (i18n/tru "Número que expresa cuánto varían los valores de una columna entre todas las filas en la respuesta.")})}
   {:short            :min
    :supported-field  :metabase.lib.types.constants/scope
    :requires-column? true
    :driver-feature   :basic-aggregations
    :display-info     (fn []
                        {:display-name (i18n/tru "Mínimo de ...")
                         :column-name  (i18n/tru "Min")
                         :description  (i18n/tru "Minimum value of a column")})}
   {:short            :max
    :supported-field  :metabase.lib.types.constants/scope
    :requires-column? true
    :driver-feature   :basic-aggregations
    :display-info     (fn []
                        {:display-name (i18n/tru "Máximo de ...")
                         :column-name  (i18n/tru "Max")
                         :description  (i18n/tru "Maximum value of a column")})}])

(mr/def ::operator
  [:map
   [:lib/type [:= :operator/aggregation]]
   [:short (into [:enum] (map :short) aggregation-operators)]
   [:supported-field {:optional true} [:maybe :keyword]] ; TODO more precise type?
   [:requires-column? :boolean]
   [:driver-feature :keyword]           ; TODO more precise type?
   [:display-info fn?]])
