import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity environment
const mockServiceCriteria = new Map()
let mockAdmin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
let mockTxSender = mockAdmin

// Mock the Clarity functions
const clarity = {
  "map-get?": (map, key) => {
    if (map === "service-criteria") {
      const serviceId = key["service-id"]
      return mockServiceCriteria.has(serviceId) ? mockServiceCriteria.get(serviceId) : null
    }
    return null
  },
  "map-set": (map, key, value) => {
    if (map === "service-criteria") {
      const serviceId = key["service-id"]
      mockServiceCriteria.set(serviceId, value)
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
  begin: (...args) => args[args.length - 1],
  "tx-sender": () => mockTxSender,
  ok: (value) => ({ status: "ok", value }),
  err: (code) => ({ status: "err", code }),
}

// Import the contract functions (mocked)
const eligibilityCriteria = {
  "add-service-criteria": (serviceId, name, minAge, maxIncome, residencyRequired, additionalRequirements) => {
    if (clarity["is-eq"](mockTxSender, clarity["var-get"]("admin"))) {
      clarity["map-set"](
          "service-criteria",
          { "service-id": serviceId },
          {
            name,
            "min-age": minAge,
            "max-income": maxIncome,
            "residency-required": residencyRequired,
            "additional-requirements": additionalRequirements,
            active: true,
          },
      )
      return clarity.ok(true)
    }
    return clarity.err(1)
  },
  
  "update-service-criteria": (serviceId, minAge, maxIncome, residencyRequired, additionalRequirements) => {
    const service = clarity["map-get?"]("service-criteria", { "service-id": serviceId })
    
    if (clarity["is-eq"](mockTxSender, clarity["var-get"]("admin")) && clarity["is-some"](service)) {
      clarity["map-set"](
          "service-criteria",
          { "service-id": serviceId },
          clarity.merge(clarity["unwrap-panic"](service), {
            "min-age": minAge,
            "max-income": maxIncome,
            "residency-required": residencyRequired,
            "additional-requirements": additionalRequirements,
          }),
      )
      return clarity.ok(true)
    }
    
    return clarity.err(2)
  },
  
  "deactivate-service": (serviceId) => {
    const service = clarity["map-get?"]("service-criteria", { "service-id": serviceId })
    
    if (clarity["is-eq"](mockTxSender, clarity["var-get"]("admin")) && clarity["is-some"](service)) {
      clarity["map-set"](
          "service-criteria",
          { "service-id": serviceId },
          clarity.merge(clarity["unwrap-panic"](service), { active: false }),
      )
      return clarity.ok(true)
    }
    
    return clarity.err(3)
  },
  
  "activate-service": (serviceId) => {
    const service = clarity["map-get?"]("service-criteria", { "service-id": serviceId })
    
    if (clarity["is-eq"](mockTxSender, clarity["var-get"]("admin")) && clarity["is-some"](service)) {
      clarity["map-set"](
          "service-criteria",
          { "service-id": serviceId },
          clarity.merge(clarity["unwrap-panic"](service), { active: true }),
      )
      return clarity.ok(true)
    }
    
    return clarity.err(4)
  },
  
  "get-service-criteria": (serviceId) => {
    return clarity["map-get?"]("service-criteria", { "service-id": serviceId })
  },
  
  "set-admin": (newAdmin) => {
    if (clarity["is-eq"](mockTxSender, clarity["var-get"]("admin"))) {
      clarity["var-set"]("admin", newAdmin)
      return clarity.ok(true)
    }
    
    return clarity.err(5)
  },
}

describe("Eligibility Criteria Contract", () => {
  beforeEach(() => {
    // Reset the mock state
    mockServiceCriteria.clear()
    mockAdmin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    mockTxSender = mockAdmin
  })
  
  it("should add a new service criteria", () => {
    const result = eligibilityCriteria["add-service-criteria"](
        "service1",
        "Housing Assistance",
        18,
        50000,
        true,
        "Must be a resident for at least 1 year",
    )
    expect(result.status).toBe("ok")
    
    const service = eligibilityCriteria["get-service-criteria"]("service1")
    expect(service).not.toBeNull()
    expect(service.name).toBe("Housing Assistance")
    expect(service.active).toBe(true)
  })
  
  it("should not add service criteria when called by non-admin", () => {
    mockTxSender = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" // Different sender
    const result = eligibilityCriteria["add-service-criteria"](
        "service1",
        "Housing Assistance",
        18,
        50000,
        true,
        "Must be a resident for at least 1 year",
    )
    expect(result.status).toBe("err")
    expect(result.code).toBe(1)
  })
  
  it("should update service criteria", () => {
    eligibilityCriteria["add-service-criteria"](
        "service1",
        "Housing Assistance",
        18,
        50000,
        true,
        "Must be a resident for at least 1 year",
    )
    
    const result = eligibilityCriteria["update-service-criteria"](
        "service1",
        21,
        60000,
        true,
        "Must be a resident for at least 2 years",
    )
    expect(result.status).toBe("ok")
    
    const service = eligibilityCriteria["get-service-criteria"]("service1")
    expect(service["min-age"]).toBe(21)
    expect(service["max-income"]).toBe(60000)
    expect(service["additional-requirements"]).toBe("Must be a resident for at least 2 years")
  })
  
  it("should deactivate a service", () => {
    eligibilityCriteria["add-service-criteria"](
        "service1",
        "Housing Assistance",
        18,
        50000,
        true,
        "Must be a resident for at least 1 year",
    )
    
    const result = eligibilityCriteria["deactivate-service"]("service1")
    expect(result.status).toBe("ok")
    
    const service = eligibilityCriteria["get-service-criteria"]("service1")
    expect(service.active).toBe(false)
  })
  
  it("should activate a service", () => {
    eligibilityCriteria["add-service-criteria"](
        "service1",
        "Housing Assistance",
        18,
        50000,
        true,
        "Must be a resident for at least 1 year",
    )
    
    eligibilityCriteria["deactivate-service"]("service1")
    const result = eligibilityCriteria["activate-service"]("service1")
    expect(result.status).toBe("ok")
    
    const service = eligibilityCriteria["get-service-criteria"]("service1")
    expect(service.active).toBe(true)
  })
})
