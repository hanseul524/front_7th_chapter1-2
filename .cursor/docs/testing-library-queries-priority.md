# Testing Library Query Priority Guide

## 📚 Overview

Testing Library provides several query methods for selecting DOM elements. This document explains **which query should be used first (priority)** and the **characteristics of each query**.

---

## 🔍 Query Types and Characteristics

### ✅ Basic Query Types

* `getBy...`: Must find exactly one matching element; throws an error if none or multiple are found.
* `queryBy...`: Returns `null` if no element is found; throws an error if multiple are found.
* `findBy...`: Finds elements asynchronously and returns a Promise.
* `getAllBy...`, `queryAllBy...`, `findAllBy...`: Versions for finding multiple elements.

### 🎯 Priority (based on query predicate)

Testing Library recommends query methods that are as **semantic and accessibility-friendly** as possible.

The general priority is as follows:

1.  `getByRole(…, { name: … })`
2.  `getByLabelText(…)`
3.  `getByPlaceholderText(…)`
4.  `getByText(…)`
5.  `getByDisplayValue(…)`
6.  `getByAltText(…)`, `getByTitle(…)`
7.  `getByTestId(…)` — Use as a last resort whenever possible

> Note: Refer to the “Which query should I use?” section for more details.

---

## 🧠 Why is Role the Priority?

* From an **Accessibility** perspective, elements with a designated role are linked with screen readers and other assistive technologies.
* The combination of `getByRole` + `name` option can appropriately select a wide range of elements.
* Queries that rely on `testId`, class names, or IDs are easily broken by implementation changes and are therefore considered the last option.

---

## ⚙️ Practical Guidelines

* Prioritize **Role**-based queries whenever possible.

```ts
// Recommended
screen.getByRole('button', { name: /submit/i });