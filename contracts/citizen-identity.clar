;; Citizen Identity Contract
;; Manages resident information and identity verification

(define-data-var admin principal tx-sender)

;; Data structure for citizen information
(define-map citizens
  { id: (string-utf8 36) }  ;; Unique identifier for the citizen
  {
    name: (string-utf8 100),
    address: (string-utf8 200),
    birth-date: uint,  ;; Unix timestamp
    verified: bool,
    registration-date: uint  ;; Unix timestamp
  }
)

;; Public function to register a new citizen
(define-public (register-citizen (id (string-utf8 36)) (name (string-utf8 100)) (address (string-utf8 200)) (birth-date uint))
  (let ((current-time (get-block-info? time (- block-height u1))))
    (if (is-some (map-get? citizens { id: id }))
      (err u1) ;; Citizen already exists
      (begin
        (map-set citizens
          { id: id }
          {
            name: name,
            address: address,
            birth-date: birth-date,
            verified: false,
            registration-date: (default-to u0 current-time)
          }
        )
        (ok true)
      )
    )
  )
)

;; Admin function to verify a citizen's identity
(define-public (verify-citizen (id (string-utf8 36)))
  (let ((citizen (map-get? citizens { id: id })))
    (if (and (is-eq tx-sender (var-get admin)) (is-some citizen))
      (begin
        (map-set citizens
          { id: id }
          (merge (unwrap-panic citizen) { verified: true })
        )
        (ok true)
      )
      (err u2) ;; Not authorized or citizen doesn't exist
    )
  )
)

;; Read-only function to get citizen information
(define-read-only (get-citizen (id (string-utf8 36)))
  (map-get? citizens { id: id })
)

;; Admin function to update citizen information
(define-public (update-citizen-info (id (string-utf8 36)) (name (string-utf8 100)) (address (string-utf8 200)))
  (let ((citizen (map-get? citizens { id: id })))
    (if (and (is-eq tx-sender (var-get admin)) (is-some citizen))
      (begin
        (map-set citizens
          { id: id }
          (merge (unwrap-panic citizen) { name: name, address: address })
        )
        (ok true)
      )
      (err u3) ;; Not authorized or citizen doesn't exist
    )
  )
)

;; Function to change admin
(define-public (set-admin (new-admin principal))
  (if (is-eq tx-sender (var-get admin))
    (begin
      (var-set admin new-admin)
      (ok true)
    )
    (err u4) ;; Not authorized
  )
)
