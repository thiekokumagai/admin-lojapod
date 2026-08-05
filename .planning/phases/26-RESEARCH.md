# Phase 26: Mobile Grid Layout for Tables - RESEARCH

## 1. Domain Investigation
The user requested to change the data tables in the mobile view of the admin panel to a stacked grid (card-based) layout. Instead of relying on horizontal scrolling (`overflow-x-auto`) which was implemented in Phase 25, the system should adapt the `<Table>` component or the page's implementation to show a grid of cards on mobile screens (`max-width: 768px` / `md` breakpoint).

### Impacted Areas:
1. **Products (`ProductListTable.tsx`)**: Needs to transform each product row (Image, Title, Price, Status, Stock) into a mobile card.
2. **Orders (`OrdersPage.tsx`)**: The orders list grouped by date needs to display each order as a card containing the order number, customer, status badges, and total.
3. **Customers (`CustomersPage.tsx`)**: The customer table (Name, Phone, Date) should become simple cards.
4. **Categories (`CategoriesPage.tsx`)**: The category draggable rows should be displayed as cards.
5. **Financials (`CashRegistersPage.tsx`, `CustosFixosPage.tsx`, `InvestmentsPage.tsx`, `CashRegisterDetailsPage.tsx`)**: The tables for transactions and summaries should be converted into card lists.

## 2. Approach Options
- **Option A (CSS Hide/Show)**: Render both `<Table>` (with `hidden md:table` or `hidden md:block`) and a `<div className="grid md:hidden">` for the mobile cards. This is the simplest to implement and maintain without complex logic.
- **Option B (Responsive Table Component)**: Modify the `Table` primitive to use `display: block` on mobile, turning `<tr/>` into cards via CSS. This requires tricky CSS with pseudo-elements for labels (`content: attr(data-label)`).
- **Option C (Conditional Rendering)**: Use a React Hook (e.g. `useMediaQuery`) to render either the Table component or a CardList component.

### Selected Approach:
**Option A (CSS Hide/Show - Tailwind Responsive Classes)** is the most robust and accessible way in a React/Tailwind ecosystem for this specific scale, ensuring that we don't have hydration mismatches and developers can clearly see the layout split for complex components like `ProductListTable` and `OrdersPage`.

## 3. Risks & Edge Cases
- **Pagination & Infinite Scroll**: We must ensure that the infinite scroll ref or pagination components stay below the rendered elements, regardless of whether it's a table or a grid.
- **Drag and Drop (Categories)**: Drag and drop might be harder to support on cards in mobile, but `CategoriesPage` has draggable rows. We should ensure the drag handle remains accessible.
- **Actions (Dropdowns, Edit, Delete)**: Action buttons need to be positioned logically within the card (usually top-right or bottom-right).
