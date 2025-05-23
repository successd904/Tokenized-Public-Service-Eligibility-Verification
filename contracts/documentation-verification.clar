;; Documentation Verification Contract
;; Validates supporting materials

(define-data-var admin principal tx-sender)

;; Data structure for document verification
(define-map documents
  {
    citizen-id: (string-utf8 36),
    document-id: (string-utf8 36)
  }
  {
    document-type: (string-utf8 50),
    document-hash: (buff 32),  ;; Hash of the document for verification
    submission-date: uint,     ;; Unix timestamp
    verified: bool,
    verification-date: (optional uint),  ;; Unix timestamp when verified
    verifier: (optional principal)       ;; Who verified the document
  }
)

;; Public function to submit a document for verification
(define-public (submit-document
                (citizen-id (string-utf8 36))
                (document-id (string-utf8 36))
                (document-type (string-utf8 50))
                (document-hash (buff 32)))
  (let ((current-time (get-block-info? time (- block-height u1))))
    (if (is-some (map-get? documents { citizen-id: citizen-id, document-id: document-id }))
      (err u1) ;; Document already exists
      (begin
        (map-set documents
          { citizen-id: citizen-id, document-id: document-id }
          {
            document-type: document-type,
            document-hash: document-hash,
            submission-date: (default-to u0 current-time),
            verified: false,
            verification-date: none,
            verifier: none
          }
        )
        (ok true)
      )
    )
  )
)

;; Admin function to verify a document
(define-public (verify-document (citizen-id (string-utf8 36)) (document-id (string-utf8 36)))
  (let (
    (document (map-get? documents { citizen-id: citizen-id, document-id: document-id }))
    (current-time (get-block-info? time (- block-height u1)))
  )
    (if (and (is-eq tx-sender (var-get admin)) (is-some document))
      (begin
        (map-set documents
          { citizen-id: citizen-id, document-id: document-id }
          (merge (unwrap-panic document)
                {
                  verified: true,
                  verification-date: (some (default-to u0 current-time)),
                  verifier: (some tx-sender)
                })
        )
        (ok true)
      )
      (err u2) ;; Not authorized or document doesn't exist
    )
  )
)

;; Read-only function to get document information
(define-read-only (get-document (citizen-id (string-utf8 36)) (document-id (string-utf8 36)))
  (map-get? documents { citizen-id: citizen-id, document-id: document-id })
)

;; Read-only function to check if a document is verified
(define-read-only (is-document-verified (citizen-id (string-utf8 36)) (document-id (string-utf8 36)))
  (match (map-get? documents { citizen-id: citizen-id, document-id: document-id })
    doc (get verified doc)
    false
  )
)

;; Function to change admin
(define-public (set-admin (new-admin principal))
  (if (is-eq tx-sender (var-get admin))
    (begin
      (var-set admin new-admin)
      (ok true)
    )
    (err u3) ;; Not authorized
  )
)
