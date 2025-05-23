;; Eligibility Criteria Contract
;; Records service requirements

(define-data-var admin principal tx-sender)

;; Data structure for service eligibility criteria
(define-map service-criteria
  { service-id: (string-utf8 36) }
  {
    name: (string-utf8 100),
    min-age: uint,
    max-income: uint,
    residency-required: bool,
    additional-requirements: (string-utf8 500),
    active: bool
  }
)

;; Public function to add a new service with its criteria
(define-public (add-service-criteria
                (service-id (string-utf8 36))
                (name (string-utf8 100))
                (min-age uint)
                (max-income uint)
                (residency-required bool)
                (additional-requirements (string-utf8 500)))
  (if (is-eq tx-sender (var-get admin))
    (begin
      (map-set service-criteria
        { service-id: service-id }
        {
          name: name,
          min-age: min-age,
          max-income: max-income,
          residency-required: residency-required,
          additional-requirements: additional-requirements,
          active: true
        }
      )
      (ok true)
    )
    (err u1) ;; Not authorized
  )
)

;; Admin function to update service criteria
(define-public (update-service-criteria
                (service-id (string-utf8 36))
                (min-age uint)
                (max-income uint)
                (residency-required bool)
                (additional-requirements (string-utf8 500)))
  (let ((service (map-get? service-criteria { service-id: service-id })))
    (if (and (is-eq tx-sender (var-get admin)) (is-some service))
      (begin
        (map-set service-criteria
          { service-id: service-id }
          (merge (unwrap-panic service)
                {
                  min-age: min-age,
                  max-income: max-income,
                  residency-required: residency-required,
                  additional-requirements: additional-requirements
                })
        )
        (ok true)
      )
      (err u2) ;; Not authorized or service doesn't exist
    )
  )
)

;; Admin function to deactivate a service
(define-public (deactivate-service (service-id (string-utf8 36)))
  (let ((service (map-get? service-criteria { service-id: service-id })))
    (if (and (is-eq tx-sender (var-get admin)) (is-some service))
      (begin
        (map-set service-criteria
          { service-id: service-id }
          (merge (unwrap-panic service) { active: false })
        )
        (ok true)
      )
      (err u3) ;; Not authorized or service doesn't exist
    )
  )
)

;; Admin function to activate a service
(define-public (activate-service (service-id (string-utf8 36)))
  (let ((service (map-get? service-criteria { service-id: service-id })))
    (if (and (is-eq tx-sender (var-get admin)) (is-some service))
      (begin
        (map-set service-criteria
          { service-id: service-id }
          (merge (unwrap-panic service) { active: true })
        )
        (ok true)
      )
      (err u4) ;; Not authorized or service doesn't exist
    )
  )
)

;; Read-only function to get service criteria
(define-read-only (get-service-criteria (service-id (string-utf8 36)))
  (map-get? service-criteria { service-id: service-id })
)

;; Function to change admin
(define-public (set-admin (new-admin principal))
  (if (is-eq tx-sender (var-get admin))
    (begin
      (var-set admin new-admin)
      (ok true)
    )
    (err u5) ;; Not authorized
  )
)
