# 🧠 Kent Beck's Test Design Philosophy (TDD Core Guide)

> "Tests are a **design tool for software**, the **specification of behavior**, and a **bulwark against regression**." — Kent Beck

---

## 1️⃣ Purpose of Testing

In TDD, testing is **not a means to find bugs, but a compass to guide correct design**.

| Category | Description |
|------|------|
| 🎯 **Specification Test** | Tests that define "what the function should do" |
| 🔍 **Regression Test** | Tests that ensure already working functionality is not broken |
| 🧩 **Design Driver Test** | Tests that drive the implementation toward a simpler, more modular direction |

---

## 2️⃣ 3 Stages of Test Design (Red → Green → Refactor)

| Stage | Description | Action Example |
|------|------|-----------|
| 🔴 **Red** | Write a failing test first. | Declare, "This feature must work," first. |
| 🟢 **Green** | Write the minimum code necessary to pass the test. | Defer complex logic; focus on 'pass' for now. |
| 🟣 **Refactor** | Remove duplication, improve clarity. | Refactor the code to make the test maintainable. |

> 💬 "Tests make you design the code, and Refactoring makes you clean up the design."

---

## 3️⃣ 5 Principles of Good Tests (Kent Beck + xUnit Patterns)

| Principle | Description |
|------|------|
| **Fast** | Tests should run quickly. (Provide immediate feedback) |
| **Independent** | Tests should not affect each other. |
| **Repeatable** | Running the test anytime, anywhere must yield the same result. |
| **Self-validating** | The result must be clearly defined as pass/fail. |
| **Timely** | Tests should be written *just before* writing the code. |

> ✅ Mnemonic: **F.I.R.S.T. Principles**

---

## 4️⃣ F.I.R.S.T. Principles and Code Examples

| Principle | Description (Emphasis) | Bad Test ❌ (Anti-Pattern) | Good Test ✅ (Best Practice) |
|------|------|------|------|
| **Fast** | Tests must execute quickly. | Tests that connect to the **network/database** every time. (Takes seconds) | Tests using **Mocking** or an **In-memory DB**. (Takes milliseconds) |
| **Independent** | Tests should not depend on the order or state of others. | A test where `testDeleteUser()` only succeeds if `testCreateUser()` runs first. | Ensures an **isolated environment** by performing independent data setup (Setup/Teardown) for each test. |
| **Repeatable** | Must guarantee the same result regardless of when run. | Tests that rely on the current **time** or **random numbers**, changing results upon execution. | Mocks the `Time Provider` or uses a fixed Seed to ensure only **predictable values** are used. |
| **Self-validating** | The result must clearly be `PASS` or `FAIL`. | A test that requires **manual checking** of logs or files after execution. | Returns an **explicit boolean result** like `Assert.Equals(expected, actual)`. |
| **Timely** | Tests must be written *just before* coding. | Tests written to **meet coverage goals** after functionality is complete or just before release. | Starts in a **Red (failing) state**, acting as the **functional specification** before design is finished. |

---

## 5️⃣ Test Design Checklist

| Category | Key Question | Example |
|------|------------|------|
| **Functional Scope** | Are all functional requirements expressed as tests? | Includes the case of "handling the 31st when selecting a recurring schedule" |
| **Input/Output Definition** | Are the input values and expected results clear? | Specify date, recurrence type, end date, etc. |
| **Edge Cases** | Inclusion of boundary values / exceptional cases | February 29th on a leap year, invalid end date, etc. |
| **Independence** | Is there no dependency between tests? | DB initialization or using Mocks |
| **Clarity** | Does the test name read like a specification? | `it('31st is only created in months that have 31 days')` |

---

## 6️⃣ Test Naming Convention (Behavior Driven)

> Test names are written from the "**user's perspective**."

| Example | Bad Example ❌ | Good Example ✅ |
|------|-------------|------------|
| Recurrence End Validation | `testEndDateLogic()` | `it('should return an error if the end date is before the start date')` |
| Recurrence Interval Validation | `testInterval()` | `it('should fail validation if the recurrence interval is less than 1')` |

> 💬 "One should be able to understand the functionality just by reading the test names."

---

## 7️⃣ Test Design Approaches

| Approach | Description | Example |
|------|------|------|
| **Example-Driven Design** | Define tests based on concrete examples | 31st $\rightarrow$ created only in specific months |
| **Boundary Testing** | Test minimum, maximum, and boundary values | `2025-12-31`, `2024-02-29` |
| **Error-Driven Design** | Write failure cases first | Invalid date $\rightarrow$ error occurs |
| **Goal-Oriented Design** | Group tests by requirement units | Group cases by recurrence type 