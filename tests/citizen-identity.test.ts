import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity environment
const mockCitizens = new Map()
let mockAdmin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
let mockTxSender = mockAdmin

// Mock the Clarity functions
const clarity = {
  "map-get?": (map, key) => {
    if (map === "citizens") {
      const id = key.id
      return mockCitizens.has(id) ? mockCitizens.get(id) : null
    }
    return null
  },
  "map-set": (map, key, value) => {
    if (map === "citizens") {
      const id = key.id
      mockCitizens.set(id, value)
    }
  },
  "var-get": (variable) => {
    if (variable === "admin") {
      return mockAdmin
    }
    return null
  },
  "var-set": (variable, value) => {
    if (variable === "admin") {
      mockAdmin = value
    }
  },
  "is-eq": (a, b) => a === b,
  "is-some": (value) => value !== null,
  "unwrap-panic": (value) => value,
  merge: (obj1, obj2) => ({ ...obj1, ...obj2 }),
  "get-block-info?": () => 1000000, // Mock timestamp
  "default-to": (defaultValue, value) => (value !== null ? value : defaultValue),
  begin: (...args) => args[args.length - 1],
  "tx-sender": () => mockTxSender,
  ok: (value) => ({ status: "ok", value }),
  err: (code) => ({ status: "err", code }),
}

// Import the contract functions (mocked)
const citizenIdentity = {
  "register-citizen": (id, name, address, birthDate) => {
    if (clarity["is-some"](clarity["map-get?"]("citizens", { id }))) {
      return clarity.err(1)
    }
    
    clarity["map-set"](
        "citizens",
        { id },
        {
          name,
          address,
          "birth-date": birthDate,
          verified: false,
          "registration-date": clarity["default-to"](0, clarity["get-block-info?"]()),
        },
    )
    
    return clarity.ok(true)
  },
  
  "verify-citizen": (id) => {
    const citizen = clarity["map-get?"]("citizens", { id })
    
    if (clarity["is-eq"](mockTxSender, clarity["var-get"]("admin")) && clarity["is-some"](citizen)) {
      clarity["map-set"]("citizens", { id }, clarity.merge(clarity["unwrap-panic"](citizen), { verified: true }))
      return clarity.ok(true)
    }
    
    return clarity.err(2)
  },
  
  "get-citizen": (id) => {
    return clarity["map-get?"]("citizens", { id })
  },
  
  "update-citizen-info": (id, name, address) => {
    const citizen = clarity["map-get?"]("citizens", { id })
    
    if (clarity["is-eq"](mockTxSender, clarity["var-get"]("admin")) && clarity["is-some"](citizen)) {
      clarity["map-set"]("citizens", { id }, clarity.merge(clarity["unwrap-panic"](citizen), { name, address }))
      return clarity.ok(true)
    }
    
    return clarity.err(3)
  },
  
  "set-admin": (newAdmin) => {
    if (clarity["is-eq"](mockTxSender, clarity["var-get"]("admin"))) {
      clarity["var-set"]("admin", newAdmin)
      return clarity.ok(true)
    }
    
    return clarity.err(4)
  },
}

describe("Citizen Identity Contract", () => {
  beforeEach(() => {
    // Reset the mock state
    mockCitizens.clear()
    mockAdmin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    mockTxSender = mockAdmin
  })
  
  it("should register a new citizen", () => {
    const result = citizenIdentity["register-citizen"]("citizen1", "John Doe", "123 Main St", 946684800)
    expect(result.status).toBe("ok")
    
    const citizen = citizenIdentity["get-citizen"]("citizen1")
    expect(citizen).not.toBeNull()
    expect(citizen.name).toBe("John Doe")
    expect(citizen.verified).toBe(false)
  })
  
  it("should not register a citizen with an existing ID", () => {
    citizenIdentity["register-citizen"]("citizen1", "John Doe", "123 Main St", 946684800)
    const result = citizenIdentity["register-citizen"]("citizen1", "Jane Doe", "456 Oak St", 946684800)
    expect(result.status).toBe("err")
    expect(result.code).toBe(1)
  })
  
  it("should verify a citizen when called by admin", () => {
    citizenIdentity["register-citizen"]("citizen1", "John Doe", "123 Main St", 946684800)
    const result = citizenIdentity["verify-citizen"]("citizen1")
    expect(result.status).toBe("ok")
    
    const citizen = citizenIdentity["get-citizen"]("citizen1")
    expect(citizen.verified).toBe(true)
  })
  
  it("should not verify a citizen when called by non-admin", () => {
    citizenIdentity["register-citizen"]("citizen1", "John Doe", "123 Main St", 946684800)
    mockTxSender = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" // Different sender
    const result = citizenIdentity["verify-citizen"]("citizen1")
    expect(result.status).toBe("err")
    expect(result.code).toBe(2)
  })
  
  it("should update citizen information when called by admin", () => {
    citizenIdentity["register-citizen"]("citizen1", "John Doe", "123 Main St", 946684800)
    const result = citizenIdentity["update-citizen-info"]("citizen1", "John Smith", "456 Oak St")
    expect(result.status).toBe("ok")
    
    const citizen = citizenIdentity["get-citizen"]("citizen1")
    expect(citizen.name).toBe("John Smith")
    expect(citizen.address).toBe("456 Oak St")
  })
  
  it("should change admin when called by current admin", () => {
    const newAdmin = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const result = citizenIdentity["set-admin"](newAdmin)
    expect(result.status).toBe("ok")
    expect(mockAdmin).toBe(newAdmin)
  })
})
