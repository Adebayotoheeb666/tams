**TAMS BEAUTY HUB**

*Inventory Management, Bookkeeping &*

*Financial Management System*

+-----------------------------------------------------------------------+
| **SOFTWARE DESIGN DOCUMENT**                                          |
|                                                                       |
| Version 2.0 \| June 2026 \| Confidential                              |
|                                                                       |
| Tams Thrift · Glitz Nails · Akure, Ondo State                         |
|                                                                       |
| **Stack: Next.js · Turso (libSQL) · Drizzle ORM · Trigger.dev**       |
+-----------------------------------------------------------------------+

  -----------------------------------------------------------------------
  **Document Property**    **Detail**
  ------------------------ ----------------------------------------------
  Document Title           Tams Beauty Hub --- Inventory, Bookkeeping &
                           Financial Management System SDD

  Version                  2.0 (Next.js + Turso + Trigger.dev Edition)

  Date                     June 2026

  Prepared For             Tams Beauty Hub (Owner)

  Classification           Confidential --- Internal Use Only

  Tech Stack               Next.js 14 (App Router), Turso (libSQL),
                           Drizzle ORM, Trigger.dev, Vercel

  Related Documents        Marketing Strategy Doc, n8n Automation
                           Workflows Pack
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **SECTION 1: DOCUMENT OVERVIEW**

  -----------------------------------------------------------------------

**1.1 Purpose & Scope**

This Software Design Document (SDD) defines the complete technical and
functional specification for the Tams Beauty Hub Inventory Management,
Bookkeeping & Financial Management System (referred to as TBH-IMS). It
is the definitive reference for all design, development, and deployment
decisions for this system.

TBH-IMS is built on a modern, serverless-friendly stack: Next.js 14 (App
Router) as the full-stack framework, Turso (libSQL) as the
edge-compatible relational database, Drizzle ORM for type-safe database
access, Trigger.dev for scheduled jobs and background tasks, and Vercel
for hosting and deployment.

The System covers the following functional scope:

-   Real-time inventory tracking for Tams Thrift products and Glitz
    Nails materials

-   Sales order and transaction management across both business units

-   Nail service appointment scheduling and management

-   Supplier and procurement management

-   Double-entry bookkeeping and chart of accounts

-   Automated financial statement generation (P&L, Balance Sheet, Cash
    Flow)

-   Business analytics and performance reporting dashboard

-   Integration with existing n8n automation workflows and WhatsApp via
    Trigger.dev jobs

**1.2 Definitions & Abbreviations**

  -----------------------------------------------------------------------
  **Term**           **Definition**
  ------------------ ----------------------------------------------------
  TBH-IMS            Tams Beauty Hub Inventory Management System --- the
                     system described in this document

  SDD                Software Design Document --- this document

  Next.js            A React-based full-stack web framework supporting
                     Server Components, API Routes, and the App Router

  App Router         The Next.js 14 routing system using the /app
                     directory with React Server Components

  Server Action      A Next.js feature allowing server-side functions to
                     be called directly from React components

  Turso              A distributed SQLite-compatible database service
                     built on libSQL, optimised for edge deployments

  libSQL             An open-source fork of SQLite with additional
                     features; the database engine powering Turso

  Drizzle ORM        A lightweight, type-safe TypeScript ORM that
                     supports libSQL/Turso natively

  Trigger.dev        An open-source background job and scheduled task
                     platform with native Next.js integration

  Vercel             A cloud platform for deploying Next.js applications
                     with global edge distribution

  SKU                Stock Keeping Unit --- a unique identifier for each
                     product variant

  COGS               Cost of Goods Sold --- direct cost of products sold
                     in a period

  P&L                Profit and Loss Statement --- financial statement
                     showing revenue and expenses

  COA                Chart of Accounts --- structured list of all
                     financial accounts in the system

  JWT                JSON Web Token --- used for secure session
                     management

  WAT                West Africa Time --- UTC+1, the local timezone for
                     scheduled job operations
  -----------------------------------------------------------------------

**1.3 Document Version History**

  --------------------------------------------------------------------------------
  **Version**   **Date**        **Author**            **Changes**
  ------------- --------------- --------------------- ----------------------------
  1.0           June 2026       Tams Beauty Hub       Initial document ---
                                                      Node.js/Express/PostgreSQL
                                                      stack

  2.0           June 2026       Tams Beauty Hub       Stack updated to Next.js,
                                                      Turso (libSQL), Drizzle ORM,
                                                      Trigger.dev
  --------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **SECTION 2: BUSINESS CONTEXT**

  -----------------------------------------------------------------------

**2.1 Business Background**

Tams Beauty Hub is a student-focused beauty and lifestyle brand
operating on and around the Federal University of Technology, Akure
(FUTA) campus. The business operates two complementary service lines:

  -------------------------------------------------------------------------
  **Brand**       **Type**        **Products / Services**  **Price Range**
  --------------- --------------- ------------------------ ----------------
  Tams Thrift     Fashion Retail  Corporate shirts, basic  ₦2,000 -- ₦4,000
                                  tops, crop tops, bodycon 
                                  tops, shorts and bottoms 

  Glitz Nails     Beauty Services Fancy press-on nails,    Service-based
                                  nail painting, nail      pricing
                                  cleaning & maintenance   
  -------------------------------------------------------------------------

The business operates across Instagram, TikTok, YouTube, WhatsApp, and
physical campus sales. All sales and operational management are
currently handled manually by the owner, creating significant
administrative burden and limiting growth potential.

**2.2 Problem Statement**

  ------------------------------------------------------------------------
  **Pain Point**        **Impact**               **Current Workaround**
  --------------------- ------------------------ -------------------------
  No real-time          Overselling out-of-stock Manual counting / memory
  inventory tracking    items; customer          
                        disappointment           

  No automated          Running out of popular   Periodic physical checks
  low-stock alerts      items without warning    

  Sales recorded        No accurate revenue      WhatsApp message logs
  informally            figures; financial blind 
                        spots                    

  No bookkeeping system Cannot track             None --- estimated
                        profit/loss, expenses,   mentally
                        or financial health      

  No financial          Cannot make informed     None prepared
  statements            decisions or apply for   
                        business credit          

  Appointment           Double-bookings, missed  WhatsApp messages
  scheduling manual     appointments, wasted     
                        time                     

  Supplier records not  Difficulty reordering,   Memory / phone contacts
  maintained            no price comparison      
                        history                  

  No analytics or       Cannot identify          None available
  reporting             best-selling items or    
                        peak sale periods        
  ------------------------------------------------------------------------

**2.3 Goals & Success Metrics**

  -----------------------------------------------------------------------
  **Goal**               **Target Metric**      **Measurement Method**
  ---------------------- ---------------------- -------------------------
  Eliminate stockouts on \< 2 stockout events   System inventory log
  popular items          per month              

  Reduce order           \< 5 minutes per order System timestamp data
  processing time                               

  Achieve accurate       100% of transactions   Monthly ledger audit
  bookkeeping            recorded               

  Generate financial     P&L and Balance Sheet  System report generation
  statements             ready in \< 5 minutes  

  Improve appointment    Zero double-bookings   Appointment calendar log
  scheduling                                    

  Reduce owner admin     Save 8+ hours per week Owner time tracking
  time                   on manual tasks        

  Enable data-driven     Weekly analytics       Dashboard usage log
  decisions              reviewed by owner      
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **SECTION 3: SYSTEM OVERVIEW**

  -----------------------------------------------------------------------

**3.1 What the System Does**

TBH-IMS is a full-stack web application built with Next.js 14 (App
Router). It runs on Vercel\'s edge network, uses Turso as its
distributed SQLite-compatible database, and uses Trigger.dev to run all
scheduled tasks, background jobs, and automation triggers. The entire
system --- frontend, backend API, server actions, and background jobs
--- lives in a single Next.js monorepo.

The system provides a unified platform to manage all operational and
financial activities of both business units --- Tams Thrift and Glitz
Nails --- from a single mobile-first interface accessible from any
smartphone.

  -----------------------------------------------------------------------
  **Module**            **Description**
  --------------------- -------------------------------------------------
  Inventory Management  Track stock levels, product details, categories,
                        and valuations in real time

  Sales & Order         Record sales, generate digital receipts, track
  Management            order history

  Appointments &        Schedule and manage Glitz Nails bookings, service
  Services              catalogue, and history

  Supplier &            Manage supplier contacts, purchase orders, and
  Procurement           procurement records

  Bookkeeping &         Double-entry bookkeeping, chart of accounts,
  Accounts              journal entries, reconciliation

  Financial Reporting   Automated P&L, Balance Sheet, Cash Flow
                        statements, and analytics dashboard
  -----------------------------------------------------------------------

**3.2 Key User Roles**

  ------------------------------------------------------------------------
  **Role**        **Who**          **Access Level** **Key Capabilities**
  --------------- ---------------- ---------------- ----------------------
  Owner / Admin   Business owner   Full access      All modules, financial
                  (primary user)                    statements, settings,
                                                    user management

  Staff           Sales assistant  Limited access   Record sales, update
                  or nail                           inventory, view
                  technician                        appointments

  Accountant      External         Finance read     View and export
  (future)        bookkeeper if    access           financial statements,
                  engaged                           read-only ledger
  ------------------------------------------------------------------------

**3.3 Why This Stack?**

  -----------------------------------------------------------------------
  **Next.js 14 (App Router)**

  -----------------------------------------------------------------------

Next.js unifies the frontend and backend in a single codebase. Server
Components fetch data directly from Turso without a separate API layer,
reducing latency. Server Actions handle form submissions and mutations
securely. API Route Handlers serve webhook endpoints for Trigger.dev and
n8n. This eliminates the need for a separate Express backend entirely.

  -----------------------------------------------------------------------
  **Turso (libSQL)**

  -----------------------------------------------------------------------

Turso is a distributed SQLite database built on libSQL (an open-source
fork of SQLite). It is ideal for this system for three reasons: (1) it
runs at the edge close to Vercel Functions, giving sub-millisecond query
times; (2) it has a generous free tier (9GB storage, 1 billion row
reads/month) suitable for a small business; (3) it is fully compatible
with Drizzle ORM and requires no separate database server to manage.

  -----------------------------------------------------------------------
  **Drizzle ORM**

  -----------------------------------------------------------------------

Drizzle is a lightweight TypeScript ORM with first-class Turso/libSQL
support. It provides type-safe schema definitions, auto-generated
migrations, and a query builder that compiles to efficient SQL. The
schema file serves as the single source of truth for both the database
structure and TypeScript types used throughout the application.

  -----------------------------------------------------------------------
  **Trigger.dev**

  -----------------------------------------------------------------------

Trigger.dev replaces cron jobs, background workers, and scheduled tasks.
It integrates natively with Next.js and Vercel. All scheduled operations
--- daily sales summaries, low-stock checks, appointment reminders,
monthly financial statement generation --- are defined as Trigger.dev
jobs in the codebase and executed reliably in the background without
blocking the web server. Trigger.dev provides a dashboard to monitor job
execution, retry failed jobs, and view logs.

  -----------------------------------------------------------------------
  **SECTION 4: FUNCTIONAL REQUIREMENTS**

  -----------------------------------------------------------------------

**4.1 Product & Stock Management**

-   Add, edit, and archive products: name, SKU, category, description,
    cost price, selling price, reorder level, and images

-   Categories for Tams Thrift: Shirts, Tops, Crop Tops, Bodycon,
    Shorts, Accessories

-   Separate consumables inventory for Glitz Nails: nail polishes,
    press-on stock, tools, supplies

-   Real-time stock quantity tracking --- automatic decrement on every
    confirmed sale

-   Manual stock adjustment with reason logging (damaged, returned,
    recount correction)

-   Stock valuation report using FIFO (First In, First Out) costing
    method

-   Bulk stock upload via CSV for initial setup and restocking events

-   Low-stock threshold per product --- system flags and triggers
    Trigger.dev job when breached

-   Full stock movement history log per product (in/out/adjustments with
    timestamps)

**4.2 Nail Service & Appointment Management**

-   Service catalogue for Glitz Nails: service name, duration, price,
    materials consumed

-   Calendar-based booking: daily, weekly, and monthly views

-   Appointment form: customer name, WhatsApp number, service, date,
    time, notes

-   Status tracking: Booked, Confirmed, In-Progress, Completed,
    Cancelled, No-Show

-   Trigger.dev scheduled job sends WhatsApp reminder 24 hours before
    each appointment

-   Full service history per customer --- all past appointments and
    services rendered

-   Daily appointment summary view for the nail technician

-   Revenue tracking per service type to identify most profitable
    services

**4.3 Sales & Order Management**

-   Point-of-sale (POS) interface: select product/service, set quantity,
    apply discount, confirm payment

-   Payment methods: Cash, Bank Transfer, POS Terminal

-   Auto-generate digital receipt: receipt number, date, items, amounts,
    payment method

-   Partial payment support --- track outstanding balance per customer

-   Sales returns and refund processing with inventory reversal and
    journal entry reversal

-   Daily sales summary with opening and closing cash balance
    reconciliation

-   Every sale automatically creates double-entry journal entries via a
    Server Action

**4.4 Low Stock Alerts & Restocking**

-   Configurable low-stock threshold per product (e.g. alert when
    quantity \< 3)

-   Trigger.dev job fires immediately when stock falls below threshold
    --- sends WhatsApp alert to owner via n8n webhook

-   Low-stock panel on dashboard showing all products currently below
    threshold

-   One-click draft purchase order creation from the low-stock panel

**4.5 Supplier & Procurement Management**

-   Supplier directory: name, contact, WhatsApp, address, product
    categories

-   Purchase order creation with line items, agreed prices, and expected
    delivery date

-   PO status tracking: Draft, Sent, Partially Received, Fully Received,
    Cancelled

-   Goods received note (GRN) --- record actual quantities received vs.
    ordered

-   Automatic inventory increase when goods are marked as received

-   Supplier payment tracking: amount owed, paid, and outstanding
    balance

**4.6 Bookkeeping & Accounts**

The bookkeeping module implements a full double-entry accounting system
tailored for a small retail and service business.

  -----------------------------------------------------------------------
  **4.6.1 Chart of Accounts**

  -----------------------------------------------------------------------

  -------------------------------------------------------------------------
  **Code**   **Account Name**      **Type**     **Description**
  ---------- --------------------- ------------ ---------------------------
  1000       Cash --- On Hand      Asset        Physical cash in the
                                                business

  1010       Bank Account ---      Asset        Main business bank account
             GTBank                             

  1100       Accounts Receivable   Asset        Money owed by customers

  1200       Thrift Inventory      Asset        Value of current thrift
                                                stock

  1210       Nail Supplies         Asset        Value of nail consumables
             Inventory                          and press-on stock

  2000       Accounts Payable      Liability    Money owed to suppliers

  2100       VAT Payable           Liability    VAT collected but not yet
                                                remitted

  3000       Owner\'s Equity       Equity       Owner\'s capital investment

  3100       Retained Earnings     Equity       Accumulated profits

  4000       Thrift Sales Revenue  Income       Revenue from
                                                clothing/thrift sales

  4100       Nail Services Revenue Income       Revenue from nail services

  5000       Cost of Goods Sold    COGS         Purchase cost of thrift
             --- Thrift                         items sold

  5100       Nail Supplies         COGS         Cost of nail materials used
             Consumed                           per service

  6000       Rent & Utilities      Expense      Space rental, electricity,
                                                data costs

  6100       Transport & Delivery  Expense      Delivery and logistics
                                                costs

  6200       Marketing &           Expense      Social media ads, printing,
             Advertising                        promotions

  6300       Packaging & Supplies  Expense      Bags, hangers, receipt
                                                paper

  6400       Platform & Software   Expense      Vercel, Trigger.dev, Turso,
             Fees                               Buffer fees

  6500       Miscellaneous         Expense      Other business costs
             Expenses                           
  -------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **4.6.2 Core Bookkeeping Functions**

  -----------------------------------------------------------------------

-   Record income entries with account classification, date,
    description, and amount

-   Record expense entries with category and receipt/document reference

-   General ledger view --- all journal entries chronologically with
    filter and search

-   Bank reconciliation: match system transactions against bank
    statement line items

-   Cash reconciliation: daily physical cash count vs. system cash
    balance

-   Audit trail: all entries are timestamped and immutable --- reversals
    only, no deletions

-   Period locking: owner locks closed months to prevent backdated
    modifications

**4.7 Financial Statement Preparation**

  -----------------------------------------------------------------------
  **4.7.1 Profit & Loss Statement**

  -----------------------------------------------------------------------

-   Revenue, COGS, Gross Profit, Operating Expenses, Net Profit/Loss

-   Periods: weekly, monthly, quarterly, annual, custom date range

-   Side-by-side comparison of two periods with variance column (₦ and
    %)

-   Breakdown by business unit: Tams Thrift vs. Glitz Nails
    profitability

-   Export to PDF and Excel --- generated by a Trigger.dev background
    job

  -----------------------------------------------------------------------
  **4.7.2 Balance Sheet**

  -----------------------------------------------------------------------

-   Total Assets, Total Liabilities, and Owner\'s Equity at any selected
    date

-   Auto-balances: Total Assets = Total Liabilities + Equity (enforced
    in application logic)

-   Inventory valued at current FIFO cost; cash and bank from reconciled
    ledger balances

  -----------------------------------------------------------------------
  **4.7.3 Cash Flow Statement**

  -----------------------------------------------------------------------

-   Operating, investing, and financing activities using the direct
    method

-   Net cash position at end of period with opening and closing cash
    balance

  -----------------------------------------------------------------------
  **4.7.4 Supporting Reports**

  -----------------------------------------------------------------------

-   Sales Report --- by period, product, category, or payment method

-   Expense Report --- by period and category with receipt attachments

-   Inventory Valuation Report --- current stock value and COGS for
    period

-   Customer Revenue Report --- top customers by total spend

-   Supplier Spending Report --- spend per supplier over a selected
    period

**4.8 Reporting & Analytics Dashboard**

-   Real-time KPI cards: Today\'s Revenue, This Week\'s Revenue, Total
    Inventory Value, Active Appointments

-   Sales trend chart --- daily revenue over the past 30 days

-   Top 5 best-selling products by quantity and by revenue

-   Top 5 most profitable nail services

-   Expense breakdown chart --- donut chart by expense category

-   Low-stock alerts panel and upcoming appointments panel (next 7 days)

-   Monthly comparison widget --- current month vs. prior month across
    key metrics

  -----------------------------------------------------------------------
  **SECTION 5: NON-FUNCTIONAL REQUIREMENTS**

  -----------------------------------------------------------------------

**5.1 Performance & Availability**

  -----------------------------------------------------------------------
  **Requirement**                **Target**
  ------------------------------ ----------------------------------------
  System availability (uptime)   99.9% --- Vercel\'s SLA on all paid
                                 plans; free tier \~99.5%

  Page load time (mobile, 4G)    \< 3 seconds --- achieved via Next.js
                                 Server Components and edge rendering

  Database query latency         \< 10ms for standard queries --- Turso
                                 edge replica closest to Vercel region

  API / Server Action response   \< 500ms for mutations; \< 2s for
                                 financial report generation

  Concurrent users supported     Vercel serverless functions scale
                                 horizontally --- no practical limit for
                                 small business

  Report generation time         P&L and Balance Sheet computed in \< 5
                                 seconds via Trigger.dev background job
  -----------------------------------------------------------------------

**5.2 Security & Access Control**

-   Authentication via NextAuth.js (Auth.js) --- supports credentials
    provider and future OAuth providers

-   Sessions stored as signed, encrypted JWTs in HTTP-only cookies ---
    not accessible to JavaScript

-   Role-based access control (RBAC): Owner, Staff, Accountant ---
    enforced in Next.js middleware

-   All Server Actions and API Route Handlers validate the session
    before processing any request

-   All connections to Turso over TLS --- database URL and auth token
    stored in Vercel environment variables

-   Sensitive fields (bank account numbers) masked by default in the UI
    with reveal-on-tap

-   Full audit log of all login events, data exports, and financial
    entries stored in the database

-   Owner can revoke staff access instantly from the Settings panel

**5.3 Usability --- Mobile-First Design**

-   All screens fully functional on 375px-wide screens (iPhone SE) and
    above

-   Primary interface designed for one-handed smartphone operation

-   Touch targets minimum 44x44px for all interactive elements

-   Core actions (record a sale, book an appointment) completable in 3
    taps or fewer

-   Nigerian English throughout --- Naira (₦) as the only currency,
    DD/MM/YYYY date format

-   Offline capability for the POS screen via Service Worker --- sales
    queued and synced on reconnection

**5.4 Scalability & Data Backup**

-   Turso supports up to 9GB on the free tier --- sufficient for years
    of business data

-   Vercel serverless functions scale automatically with traffic --- no
    manual server management

-   Turso provides point-in-time recovery and automatic replication
    across edge locations

-   Manual backup export available at any time --- owner downloads full
    data as JSON or CSV

-   All financial entries are immutable and retained permanently --- no
    data is ever deleted

  -----------------------------------------------------------------------
  **SECTION 6: SYSTEM ARCHITECTURE**

  -----------------------------------------------------------------------

**6.1 Architecture Overview**

TBH-IMS is a full-stack Next.js 14 application deployed on Vercel. It
uses a single monorepo containing the UI (React Server Components +
Client Components), data layer (Drizzle ORM + Turso), server-side logic
(Server Actions + API Route Handlers), and background jobs
(Trigger.dev). There is no separate backend service --- Next.js handles
everything.

  ------------------------------------------------------------------------
  **Layer**           **Technology**        **Role**
  ------------------- --------------------- ------------------------------
  Full-Stack          Next.js 14 (App       React Server Components for
  Framework           Router)               UI, Server Actions for
                                            mutations, API Routes for
                                            webhooks

  UI Library          React 18 + Tailwind   Component-based UI with
                      CSS                   utility-first styling;
                                            shadcn/ui for pre-built
                                            components

  Database            Turso (libSQL /       Distributed edge-compatible
                      SQLite)               relational database --- no
                                            separate server required

  ORM & Schema        Drizzle ORM           Type-safe schema definitions,
                                            query builder, auto-generated
                                            SQL migrations

  Background Jobs     Trigger.dev           Scheduled cron jobs,
                                            event-triggered tasks, webhook
                                            delivery, job monitoring
                                            dashboard

  Authentication      Auth.js (NextAuth v5) Session management, role-based
                                            access control, HTTP-only
                                            cookie sessions

  Hosting &           Vercel                Serverless deployment, edge
  Deployment                                functions, environment
                                            variables, CI/CD from Git

  File Storage        Cloudinary            Product images, PDF report
                                            storage, receipt attachments

  PDF Generation      React PDF (react-pdf) Financial statement and
                                            receipt PDF generation in a
                                            Trigger.dev background job

  Excel Export        ExcelJS               Financial report Excel export
                                            in a Trigger.dev background
                                            job

  Charts &            Recharts              Dashboard KPI charts, sales
  Visualisation                             trends, expense breakdowns
  ------------------------------------------------------------------------

**6.2 Next.js App Router Structure**

The application follows the Next.js 14 App Router file-system
conventions. The directory structure is organised as follows:

  --------------------------------------------------------------------------------------------
  **Directory / File**                             **Purpose**
  ------------------------------------------------ -------------------------------------------
  app/(auth)/login/page.tsx                        Login screen --- uses Auth.js credentials
                                                   provider

  app/(dashboard)/page.tsx                         Main dashboard with KPI cards and charts
                                                   (Server Component)

  app/(dashboard)/inventory/page.tsx               Product list screen --- server-rendered
                                                   with Turso query

  app/(dashboard)/inventory/\[id\]/page.tsx        Individual product detail and stock history

  app/(dashboard)/sales/page.tsx                   Sales history list --- paginated,
                                                   server-rendered

  app/(dashboard)/sales/new/page.tsx               POS new sale screen --- client component
                                                   for interactivity

  app/(dashboard)/appointments/page.tsx            Appointment calendar --- client component
                                                   (react-big-calendar)

  app/(dashboard)/bookkeeping/ledger/page.tsx      General ledger --- server-rendered with
                                                   filter params

  app/(dashboard)/finance/pnl/page.tsx             P&L statement with period selector

  app/(dashboard)/finance/balance-sheet/page.tsx   Balance sheet with date selector

  app/(dashboard)/finance/cash-flow/page.tsx       Cash flow statement

  app/api/webhooks/trigger/route.ts                Trigger.dev webhook receiver --- receives
                                                   job callbacks

  app/api/webhooks/n8n/route.ts                    n8n inbound webhook receiver for low-stock
                                                   and order events

  lib/db/schema.ts                                 Drizzle ORM schema --- single source of
                                                   truth for all database tables

  lib/db/index.ts                                  Turso client initialisation and Drizzle
                                                   instance

  lib/actions/sales.ts                             Server Actions for creating sales, refunds,
                                                   and receipts

  lib/actions/inventory.ts                         Server Actions for product CRUD and stock
                                                   adjustments

  lib/actions/bookkeeping.ts                       Server Actions for journal entries,
                                                   expenses, reconciliation

  lib/actions/finance.ts                           Server Actions for P&L, Balance Sheet, and
                                                   Cash Flow computation

  trigger/jobs/daily-summary.ts                    Trigger.dev cron job --- daily sales
                                                   summary at 11pm WAT

  trigger/jobs/appointment-reminders.ts            Trigger.dev cron job --- 24hr appointment
                                                   reminders at 9am WAT

  trigger/jobs/monthly-statements.ts               Trigger.dev cron job --- financial
                                                   statement generation on 1st of month

  trigger/jobs/low-stock-alert.ts                  Trigger.dev event job --- fires when
                                                   inventory drops below threshold
  --------------------------------------------------------------------------------------------

**6.3 Data Flow --- Sale Transaction**

1.  Owner opens /sales/new on their smartphone (POS screen --- Client
    Component)

2.  Client Component loads available products via a Server Component or
    fetch to a cached API route

3.  Owner selects items, enters payment details, and clicks Confirm Sale

4.  Client calls the createSale() Server Action defined in
    lib/actions/sales.ts

5.  Server Action opens a Drizzle transaction against Turso ---
    atomically: records the order, decrements inventory, and inserts
    journal entry lines

6.  After the transaction commits, Server Action checks if any product
    fell below its reorder_level

7.  If a low-stock condition is detected, Server Action calls
    Trigger.dev\'s triggerEvent() to fire the low-stock-alert job

8.  Trigger.dev job calls the n8n webhook, which sends a WhatsApp alert
    to the owner

9.  Server Action returns the completed order data including
    receipt_number to the client

10. Client displays the digital receipt with a Share to WhatsApp button

**6.4 Third-Party Integrations**

  ------------------------------------------------------------------------
  **Integration**    **Purpose**                 **How Connected**
  ------------------ --------------------------- -------------------------
  Trigger.dev        All scheduled cron jobs and Native Next.js SDK ---
                     background tasks            triggerEvent() from
                                                 Server Actions, cron
                                                 definitions in
                                                 /trigger/jobs/

  n8n (Automation)   WhatsApp alerts, Google     HTTP POST from
                     Sheets sync, weekly reports Trigger.dev jobs to n8n
                                                 webhook URLs

  Turso              Edge-distributed SQLite     Drizzle ORM client
                     database                    initialised with
                                                 TURSO_DATABASE_URL and
                                                 TURSO_AUTH_TOKEN env vars

  Auth.js            Authentication and session  next-auth package ---
                     management                  config in auth.ts,
                                                 middleware in
                                                 middleware.ts

  Cloudinary         Product images and exported REST API calls from
                     PDF storage                 Server Actions

  Vercel             Hosting, CI/CD, edge        Git push deploys
                     functions, environment      automatically via Vercel
                     variables                   GitHub integration
  ------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **SECTION 7: DATABASE DESIGN (DRIZZLE ORM + TURSO)**

  -----------------------------------------------------------------------

**7.1 Schema Overview**

The entire database schema is defined in a single TypeScript file:
lib/db/schema.ts. Drizzle reads this file to generate SQL migrations
that are applied to Turso. Because Turso uses libSQL
(SQLite-compatible), all column types follow SQLite conventions. Drizzle
provides TypeScript type inference from the schema --- the same types
are used in Server Actions and components throughout the application.

All tables use text-based UUIDs as primary keys (generated via
crypto.randomUUID() in application code). Timestamps are stored as ISO
8601 text strings. Monetary amounts are stored as integers in kobo (1
naira = 100 kobo) to avoid floating-point precision errors in SQLite.

  --------------- ------------------------------------------------------------
  **Important**   All monetary values are stored as INTEGER (kobo) in the
                  database. ₦2,500 is stored as 250000. The application layer
                  converts to naira for display. This is the recommended
                  practice for financial data in SQLite/libSQL.

  --------------- ------------------------------------------------------------

**7.2 Drizzle Schema Definitions**

  -----------------------------------------------------------------------
  **products table**

  -----------------------------------------------------------------------

  ----------------------------------------------------------------------------------------------------
  **Column**       **Drizzle Type**             **Constraints**                  **Description**
  ---------------- ---------------------------- -------------------------------- ---------------------
  id               text(\'id\')                 primaryKey()                     UUID --- generated by
                                                                                 crypto.randomUUID()

  sku              text(\'sku\')                unique(), notNull()              Stock keeping unit
                                                                                 code

  name             text(\'name\')               notNull()                        Product display name

  categoryId       text(\'category_id\')        references(()=\>categories.id)   FK to categories
                                                                                 table

  businessUnit     text(\'business_unit\')      notNull()                        \'thrift\' or
                                                                                 \'nails\'

  description      text(\'description\')        ---                              Optional product
                                                                                 description

  costPrice        integer(\'cost_price\')      notNull()                        Purchase cost in kobo

  sellingPrice     integer(\'selling_price\')   notNull()                        Selling price in kobo

  quantity         integer(\'quantity\')        notNull(), default(0)            Current stock
                                                                                 quantity

  reorderLevel     integer(\'reorder_level\')   notNull(), default(3)            Low-stock alert
                                                                                 threshold

  imageUrl         text(\'image_url\')          ---                              Cloudinary image URL

  isActive         integer(\'is_active\')       notNull(), default(1)            Soft delete:
                                                                                 1=active, 0=archived

  createdAt        text(\'created_at\')         notNull()                        ISO 8601 timestamp

  updatedAt        text(\'updated_at\')         notNull()                        ISO 8601 timestamp
                                                                                 --- updated on every
                                                                                 write
  ----------------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **orders table**

  -----------------------------------------------------------------------

  -------------------------------------------------------------------------------------------------
  **Column**       **Drizzle Type**               **Constraints**                 **Description**
  ---------------- ------------------------------ ------------------------------- -----------------
  id               text(\'id\')                   primaryKey()                    UUID

  receiptNumber    text(\'receipt_number\')       unique(), notNull()             Human-readable
                                                                                  receipt (e.g.
                                                                                  TBH-0042)

  customerId       text(\'customer_id\')          references(()=\>customers.id)   Nullable FK ---
                                                                                  null for walk-ins

  orderDate        text(\'order_date\')           notNull()                       ISO 8601
                                                                                  timestamp of sale

  subtotal         integer(\'subtotal\')          notNull()                       Total before
                                                                                  discount (kobo)

  discountAmount   integer(\'discount_amount\')   notNull(), default(0)           Discount applied
                                                                                  (kobo)

  totalAmount      integer(\'total_amount\')      notNull()                       Final amount
                                                                                  charged (kobo)

  paymentMethod    text(\'payment_method\')       notNull()                       \'cash\' \|
                                                                                  \'transfer\' \|
                                                                                  \'pos\'

  paymentStatus    text(\'payment_status\')       notNull()                       \'paid\' \|
                                                                                  \'partial\' \|
                                                                                  \'unpaid\'

  amountPaid       integer(\'amount_paid\')       notNull()                       Amount received
                                                                                  (kobo)

  balanceDue       integer(\'balance_due\')       notNull(), default(0)           Outstanding
                                                                                  balance (kobo)

  createdBy        text(\'created_by\')           references(()=\>users.id)       Staff member who
                                                                                  recorded the sale

  createdAt        text(\'created_at\')           notNull()                       ISO 8601
                                                                                  timestamp
  -------------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **journal_entries and journal_entry_lines tables**

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------------------------
  **Column**       **Drizzle Type**           **Constraints**             **Description**
  ---------------- -------------------------- --------------------------- -----------------
  id               text(\'id\')               primaryKey()                UUID

  entryNumber      text(\'entry_number\')     unique(), notNull()         Human-readable ID
                                                                          (e.g. JE-0001)

  entryDate        text(\'entry_date\')       notNull()                   Date of the
                                                                          accounting entry
                                                                          (YYYY-MM-DD)

  description      text(\'description\')      notNull()                   Description of
                                                                          the transaction

  referenceType    text(\'reference_type\')   notNull()                   \'sale\' \|
                                                                          \'purchase\' \|
                                                                          \'expense\' \|
                                                                          \'adjustment\' \|
                                                                          \'opening\'

  referenceId      text(\'reference_id\')     ---                         ID of the source
                                                                          record (order ID,
                                                                          expense ID, etc.)

  isReversed       integer(\'is_reversed\')   notNull(), default(0)       1 if this entry
                                                                          has been reversed

  createdBy        text(\'created_by\')       references(()=\>users.id)   User who created
                                                                          the entry

  createdAt        text(\'created_at\')       notNull()                   ISO 8601
                                                                          timestamp
  -----------------------------------------------------------------------------------------

  -----------------------------------------------------------------------------------------------------
  **Column**       **Drizzle Type**             **Constraints**                       **Description**
  ---------------- ---------------------------- ------------------------------------- -----------------
  id               text(\'id\')                 primaryKey()                          UUID

  journalEntryId   text(\'journal_entry_id\')   references(()=\>journalEntries.id),   Parent journal
                                                notNull()                             entry

  accountId        text(\'account_id\')         references(()=\>accounts.id),         Account being
                                                notNull()                             debited or
                                                                                      credited

  entryType        text(\'entry_type\')         notNull()                             \'debit\' or
                                                                                      \'credit\'

  amount           integer(\'amount\')          notNull()                             Transaction
                                                                                      amount in kobo
                                                                                      (always positive)

  description      text(\'description\')        ---                                   Optional
                                                                                      line-level
                                                                                      description
  -----------------------------------------------------------------------------------------------------

Double-entry balance rule: for every journal_entry, the sum of all debit
line amounts must equal the sum of all credit line amounts. This
constraint is enforced in the createJournalEntry() Server Action before
any insert is committed to Turso.

  -----------------------------------------------------------------------
  **appointments table**

  -----------------------------------------------------------------------

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Column**        **Drizzle Type**             **Constraints**                 **Description**
  ----------------- ---------------------------- ------------------------------- ---------------------------------------------------------------------------------------
  id                text(\'id\')                 primaryKey()                    UUID

  customerId        text(\'customer_id\')        references(()=\>customers.id)   Nullable FK --- null for walk-ins

  customerName      text(\'customer_name\')      notNull()                       Name (denormalised for walk-ins)

  customerPhone     text(\'customer_phone\')     notNull()                       WhatsApp number for Trigger.dev reminder job

  serviceId         text(\'service_id\')         references(()=\>services.id),   Service being booked
                                                 notNull()                       

  appointmentDate   text(\'appointment_date\')   notNull()                       Date of appointment (YYYY-MM-DD)

  startTime         text(\'start_time\')         notNull()                       Start time (HH:MM)

  endTime           text(\'end_time\')           notNull()                       End time (HH:MM)

  status            text(\'status\')             notNull()                       \'booked\'\|\'confirmed\'\|\'in_progress\'\|\'completed\'\|\'cancelled\'\|\'no_show\'

  priceCharged      integer(\'price_charged\')   notNull()                       Agreed price in kobo

  reminderSent      integer(\'reminder_sent\')   notNull(), default(0)           1 once Trigger.dev has sent the 24hr reminder

  createdAt         text(\'created_at\')         notNull()                       ISO 8601 timestamp
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------

**7.3 Drizzle Migration Workflow**

11. Developer updates lib/db/schema.ts with new tables or columns

12. Run: npx drizzle-kit generate \-- generates a new SQL migration file
    in /drizzle/ directory

13. Run: npx drizzle-kit migrate \-- applies the migration to the Turso
    database

14. Migration files are committed to Git alongside the schema change for
    full version history

15. On Vercel deploy, migrations run automatically as part of the build
    step via a postbuild script

  -----------------------------------------------------------------------
  **SECTION 8: BOOKKEEPING & ACCOUNTING MODULE DESIGN**

  -----------------------------------------------------------------------

**8.1 Double-Entry Bookkeeping Logic**

Every financial transaction in TBH-IMS generates a balanced journal
entry via the createJournalEntry() Server Action in
lib/actions/bookkeeping.ts. The Server Action validates debit/credit
balance before committing to Turso. No transaction can be saved in an
unbalanced state.

  -------------------------------------------------------------------------
  **Transaction**       **Debit Account**  **Credit Account** **Amount**
  --------------------- ------------------ ------------------ -------------
  Cash sale --- thrift  1000 Cash on Hand  4000 Thrift Sales  Sale amount
  item                                     Revenue            

  Transfer sale ---     1010 Bank Account  4000 Thrift Sales  Sale amount
  thrift item                              Revenue            

  COGS recognition on   5000 COGS ---      1200 Thrift        Cost price of
  sale                  Thrift             Inventory          item

  Cash sale --- nail    1000 Cash on Hand  4100 Nail Services Service price
  service                                  Revenue            

  Nail supplies         5100 Nail Supplies 1210 Nail Supplies Materials
  consumed              Consumed           Inventory          cost

  Purchase thrift stock 1200 Thrift        1000 Cash on Hand  Purchase
  (cash)                Inventory                             amount

  Purchase thrift stock 1200 Thrift        2000 Accounts      Purchase
  (credit)              Inventory          Payable            amount

  Payment to supplier   2000 Accounts      1010 Bank Account  Payment
                        Payable                               amount

  Business expense      6xxx Relevant      1000 Cash on Hand  Expense
  (cash)                Expense                               amount

  Business expense      6xxx Relevant      1010 Bank Account  Expense
  (transfer)            Expense                               amount

  Owner capital         1010 Bank Account  3000 Owner\'s      Amount
  injection                                Equity             injected

  Owner withdrawal      3000 Owner\'s      1010 Bank Account  Amount
                        Equity                                withdrawn
  -------------------------------------------------------------------------

**8.2 Automated Journal Entry Generation**

  -----------------------------------------------------------------------------
  **Trigger Event**     **Auto Journal Entries      **How Triggered**
                        Generated**                 
  --------------------- --------------------------- ---------------------------
  Sale confirmed in POS Revenue entry + COGS        createSale() Server Action
                        entry + inventory decrement --- single Drizzle
                                                    transaction

  Appointment marked    Service revenue entry       updateAppointmentStatus()
  Completed                                         Server Action

  Purchase order marked Inventory increase + AP     receivePurchaseOrder()
  Received              increase (or cash decrease) Server Action

  Expense recorded      Expense debit + cash/bank   createExpense() Server
                        credit                      Action

  Supplier payment      AP decrease + cash/bank     recordSupplierPayment()
  recorded              decrease                    Server Action

  Stock adjustment      COGS increase + inventory   adjustStock() Server Action
  (damage/loss)         decrease                    

  Opening balance setup Initial balances for all    Onboarding wizard ---
                        accounts                    setOpeningBalances() Server
                                                    Action
  -----------------------------------------------------------------------------

**8.3 Server Action Pattern for Bookkeeping**

All bookkeeping mutations follow this pattern in the Server Action layer
to ensure atomicity and data integrity in Turso:

  -----------------------------------------------------------------------
  **Pattern: createSale() Server Action**

  -----------------------------------------------------------------------

16. Validate the incoming sale data (items, quantities, payment method)

17. Open a Drizzle db.transaction() block against Turso

18. Insert the order record into the orders table

19. Insert each line item into the order_items table

20. For each item: decrement products.quantity by the sold quantity

21. Determine the correct journal entry accounts based on payment method
    and business unit

22. Insert one journal_entries row and two or more journal_entry_lines
    rows (debits + credits)

23. Assert that sum(debit lines) === sum(credit lines) --- throw if
    unbalanced

24. Commit the transaction --- all of the above either fully succeeds or
    fully rolls back

25. After commit: check each product\'s quantity against reorder_level
    --- fire Trigger.dev event if breached

**8.4 Period Closing Process**

-   Monthly close: owner reviews all transactions, runs reconciliation
    check, and clicks Lock Period

-   Locking writes a period_locks row to Turso --- all Server Actions
    check for locks before accepting entries

-   A closing journal entry transfers net income/loss to Retained
    Earnings (3100) at month end

-   Year-end close resets all income and expense account balances and
    carries net profit to Retained Earnings

-   Trigger.dev runs a monthly-close-reminder job on the 25th of each
    month to prompt the owner to close

  -----------------------------------------------------------------------
  **SECTION 9: FINANCIAL STATEMENTS MODULE DESIGN**

  -----------------------------------------------------------------------

**9.1 Statement Generation Architecture**

Financial statements are generated by the computeFinancialStatement()
function in lib/actions/finance.ts. For on-screen viewing, statements
are computed as Server Actions returning structured JSON --- React
renders them directly in Server Components. For PDF/Excel export,
Trigger.dev background jobs handle the generation asynchronously and
upload the output to Cloudinary, emailing the download link to the
owner.

**9.2 Profit & Loss Generation Logic**

  ------------- ------------------------------------------------------------
  **Revenue**   SUM of all credit amounts on journal_entry_lines WHERE
                account type = \'income\' AND entry_date BETWEEN ?from AND
                ?to

  ------------- ------------------------------------------------------------

  ---------- ------------------------------------------------------------
  **COGS**   SUM of all debit amounts on journal_entry_lines WHERE
             account type = \'cogs\' AND entry_date BETWEEN ?from AND ?to

  ---------- ------------------------------------------------------------

  ---------- ------------------------------------------------------------
  **Gross    Revenue minus COGS
  Profit**   

  ---------- ------------------------------------------------------------

  ------------ ------------------------------------------------------------
  **Total      SUM of all debit amounts WHERE account type = \'expense\'
  Expenses**   AND entry_date BETWEEN ?from AND ?to

  ------------ ------------------------------------------------------------

  ---------- ------------------------------------------------------------
  **Net      Gross Profit minus Total Expenses
  Profit /   
  Loss**     

  ---------- ------------------------------------------------------------

Business unit breakdown: Thrift revenue = credits on account 4000; Nails
revenue = credits on account 4100. This is a simple account filter on
the same journal_entry_lines query.

**9.3 Balance Sheet Computation**

  ------------------------------------------------------------------------
  **Section**        **Accounts**              **Computation**
  ------------------ ------------------------- ---------------------------
  Current Assets     1000 Cash, 1010 Bank,     Running debit balance from
                     1100 AR                   beginning of time to
                                               selected date

  Inventory          1200 Thrift Inventory,    Running debit balance from
                     1210 Nail Supplies        beginning of time to
                                               selected date

  Total Assets       All asset accounts        Sum of all asset account
                                               balances

  Current            2000 AP, 2100 VAT Payable Running credit balance from
  Liabilities                                  beginning of time to
                                               selected date

  Equity             3000 Owner\'s Equity,     Running credit balance +
                     3100 Retained Earnings    current period
                                               undistributed net profit

  Balance Assertion  ---                       Server Action throws if
                                               Total Assets ≠ Total
                                               Liabilities + Equity
  ------------------------------------------------------------------------

**9.4 PDF Export via Trigger.dev**

26. Owner clicks Export PDF on any financial statement screen

27. Client calls the exportStatement() Server Action with { type, from,
    to }

28. Server Action calls trigger.sendEvent({ name: \'export.statement\',
    payload: { type, from, to, userId } })

29. Trigger.dev picks up the event and runs the export job in the
    background

30. The job computes the statement data, renders it to PDF using
    react-pdf, and uploads to Cloudinary

31. The job calls the /api/webhooks/trigger route to notify the app the
    export is ready

32. The app updates the UI --- a download link appears; the owner is
    also notified via WhatsApp

**9.5 Multi-Period Comparison**

-   P&L side-by-side: pass two date ranges to computePnL() --- returns
    two result sets with a computed variance

-   Variance column: absolute difference (₦) and percentage change for
    each line item

-   Trend chart: calls computeMonthlyPnL() for the last 12 months ---
    returns array of { month, revenue, expenses, profit }

-   Chart rendered by Recharts LineChart in a Client Component on the
    Finance screens

  -----------------------------------------------------------------------
  **SECTION 10: UI/UX DESIGN SPECIFICATIONS**

  -----------------------------------------------------------------------

**10.1 Screen Inventory**

  ------------------------------------------------------------------------------------
  **Screen / Route**               **Module**     **Component     **Description**
                                                  Type**          
  -------------------------------- -------------- --------------- --------------------
  /login                           Auth           Client          Email/password login
                                                  Component       --- Auth.js
                                                                  credentials provider

  /                                Dashboard      Server          KPI cards, sales
                                                  Component       chart, low-stock
                                                                  panel, upcoming
                                                                  appointments

  /inventory                       Inventory      Server          Product grid with
                                                  Component       stock badges and
                                                                  search

  /inventory/new                   Inventory      Client          Add product form
                                                  Component       with image upload

  /inventory/\[id\]                Inventory      Server          Product detail, edit
                                                  Component       form, stock movement
                                                                  history

  /sales                           Sales          Server          Paginated sales
                                                  Component       history with filters

  /sales/new                       Sales          Client          POS screen ---
                                                  Component       interactive cart and
                                                                  payment

  /sales/\[id\]                    Sales          Server          Order detail with
                                                  Component       receipt view and
                                                                  refund option

  /appointments                    Appointments   Client          Calendar view ---
                                                  Component       react-big-calendar

  /appointments/new                Appointments   Client          Booking form with
                                                  Component       service and time
                                                                  slot selection

  /services                        Services       Server          Nail service
                                                  Component       catalogue with
                                                                  pricing

  /suppliers                       Suppliers      Server          Supplier directory
                                                  Component       

  /suppliers/purchase-orders       Procurement    Server          Purchase order list
                                                  Component       and status

  /bookkeeping/ledger              Bookkeeping    Server          General ledger with
                                                  Component       date and account
                                                                  filters

  /bookkeeping/reconciliation      Bookkeeping    Client          Bank/cash
                                                  Component       reconciliation
                                                                  matching interface

  /bookkeeping/chart-of-accounts   Bookkeeping    Server          COA list with
                                                  Component       account balances

  /finance/pnl                     Finance        Server          P&L statement with
                                                  Component       period selector and
                                                                  export

  /finance/balance-sheet           Finance        Server          Balance sheet with
                                                  Component       date selector and
                                                                  export

  /finance/cash-flow               Finance        Server          Cash flow statement
                                                  Component       with export

  /finance/expenses                Finance        Server          Expense report with
                                                  Component       category filter

  /settings                        Settings       Client          Business profile,
                                                  Component       user management,
                                                                  notification
                                                                  settings
  ------------------------------------------------------------------------------------

**10.2 Component Architecture**

TBH-IMS follows the Next.js 14 recommended pattern of using Server
Components for data fetching and rendering, with Client Components only
where interactivity is required:

  ------------------------------------------------------------------------
  **Pattern**        **When Used**          **Examples**
  ------------------ ---------------------- ------------------------------
  Server Component   Screens that display   Dashboard, Sales History,
  (default)          data fetched from      Ledger, P&L Statement
                     Turso                  

  Client Component   Interactive forms,     POS screen, Appointment
  (\'use client\')   real-time updates,     Calendar, Reconciliation tool
                     charts, calendar       

  Server Action      All data mutations --- createSale(),
  (lib/actions/)     form submissions,      createJournalEntry(),
                     sales, bookkeeping     bookAppointment()

  API Route Handler  Webhooks from          POST /api/webhooks/trigger,
  (app/api/)         Trigger.dev and n8n;   GET /api/receipts/\[id\]
                     receipt PDF download   

  Streaming +        Progressive loading    Ledger, Sales History --- data
  Suspense           for large data screens loads section by section
  ------------------------------------------------------------------------

**10.3 Key Screen Wireframe Descriptions**

  -----------------------------------------------------------------------
  **Dashboard --- /**

  -----------------------------------------------------------------------

A 2x2 responsive grid of KPI metric cards at the top (Today\'s Revenue,
This Week\'s Revenue, Total Inventory Value, Active Appointments Today).
Below: a full-width Recharts LineChart of daily revenue for the past 30
days, computed server-side and passed as props. Two columns below the
chart: left shows Top 5 Products; right shows Low Stock Alerts and next
3 upcoming appointments. All data fetched in parallel using
Promise.all() in the Server Component.

  -----------------------------------------------------------------------
  **POS --- /sales/new**

  -----------------------------------------------------------------------

A Client Component with two panels. Left: product search with instant
filter (useOptimistic for immediate feedback), product cards showing
name, price, and stock level. Right: running cart with quantity controls
(+/-), discount input, subtotal/total display, payment method radio
buttons, and a large Confirm Sale button. On confirmation: calls
createSale() Server Action, shows an animated receipt modal with a Share
via WhatsApp link.

  -----------------------------------------------------------------------
  **P&L Statement --- /finance/pnl**

  -----------------------------------------------------------------------

A Server Component that accepts searchParams for ?from, ?to, and
?compare. Renders the statement as a structured table with colour-coded
rows: Revenue section (Thrift, Nails, Total), COGS section, Gross Profit
row (teal highlight), Expenses section (itemised by category), Net
Profit/Loss row (green if positive, red if negative). Export to PDF and
Export to Excel buttons trigger Trigger.dev background jobs. A
comparison column appears when ?compare is present in the URL.

**10.4 Mobile-First Design Guidelines**

-   Use shadcn/ui components throughout --- they are accessible,
    mobile-friendly, and Tailwind-based

-   Bottom navigation bar on mobile (/inventory, /sales/new,
    /appointments, /finance, /settings)

-   All data tables collapse to card lists on screens below 640px
    (Tailwind sm: breakpoint)

-   Large touch targets via Tailwind: min-h-\[44px\] min-w-\[44px\] on
    all interactive elements

-   Loading states via React Suspense boundaries --- skeleton loaders,
    never blank screens

-   Numbers formatted using Intl.NumberFormat(\'en-NG\', { style:
    \'currency\', currency: \'NGN\' })

-   Primary brand colour (#C0356A) as the Tailwind theme primary colour

  -----------------------------------------------------------------------
  **SECTION 11: API & SERVER ACTION DESIGN**

  -----------------------------------------------------------------------

**11.1 Server Actions vs. API Routes**

In TBH-IMS, the primary way the UI mutates data is via Next.js Server
Actions --- not traditional REST API endpoints. Server Actions are
TypeScript functions marked with \'use server\' that execute on the
server and can be called directly from Client Components. They handle
authentication checks, Drizzle database writes, and Trigger.dev event
firing.

API Route Handlers (app/api/) are used only for: (1) inbound webhooks
from Trigger.dev and n8n, (2) file download endpoints (PDF receipts,
Excel exports), and (3) any third-party service that cannot call Server
Actions directly.

**11.2 Core Server Actions**

  -----------------------------------------------------------------------
  **lib/actions/sales.ts**

  -----------------------------------------------------------------------

  ----------------------------------------------------------------------------
  **Server Action**     **Parameters**         **Returns**   **Description**
  --------------------- ---------------------- ------------- -----------------
  createSale()          { items\[\],           { order,      Creates sale,
                        paymentMethod,         receipt }     decrements stock,
                        customerId?, discount                generates journal
                        }                                    entries --- all
                                                             in one Drizzle
                                                             transaction

  processRefund()       { orderId, reason,     { success }   Reverses sale ---
                        items\[\] }                          restores stock,
                                                             creates reversal
                                                             journal entries

  getOrderById()        { id }                 { order,      Fetches a single
                                               items\[\],    order with full
                                               receipt }     line item detail

  getSalesHistory()     { from, to, page,      { orders\[\], Paginated sales
                        limit }                total }       list with
                                                             optional date
                                                             filter
  ----------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **lib/actions/inventory.ts**

  -----------------------------------------------------------------------

  ----------------------------------------------------------------------------------
  **Server Action**       **Parameters**            **Returns**    **Description**
  ----------------------- ------------------------- -------------- -----------------
  createProduct()         { name, sku, categoryId,  { product }    Creates a new
                          costPrice, sellingPrice,                 product
                          reorderLevel, \... }                     

  updateProduct()         { id, \...fields }        { product }    Updates product
                                                                   details or
                                                                   pricing

  adjustStock()           { productId, delta,       { product }    Records a manual
                          reason }                                 stock adjustment
                                                                   with reason log

  getLowStockProducts()   ---                       { products\[\] Returns all
                                                    }              products below
                                                                   their
                                                                   reorder_level
  ----------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **lib/actions/bookkeeping.ts**

  -----------------------------------------------------------------------

  --------------------------------------------------------------------------------------
  **Server Action**       **Parameters**               **Returns**     **Description**
  ----------------------- ---------------------------- --------------- -----------------
  createJournalEntry()    { date, description,         { entry }       Creates a manual
                          referenceType,                               journal entry ---
                          lines\[{accountId,                           validates
                          entryType, amount}\] }                       debit/credit
                                                                       balance before
                                                                       inserting

  reverseJournalEntry()   { entryId, reason }          { reversalEntry Creates a contra
                                                       }               entry reversing
                                                                       the original ---
                                                                       both entries
                                                                       remain in the
                                                                       ledger

  getLedger()             { from, to, accountId?, page { entries\[\],  Returns paginated
                          }                            total }         general ledger
                                                                       with optional
                                                                       filters

  createExpense()         { date, accountId, amount,   { expense }     Records an
                          description, receiptUrl? }                   expense and
                                                                       creates journal
                                                                       entry
                                                                       automatically

  lockPeriod()            { year, month }              { success }     Locks a closed
                                                                       month to prevent
                                                                       backdated entries
  --------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **lib/actions/finance.ts**

  -----------------------------------------------------------------------

  ----------------------------------------------------------------------------------------
  **Server Action**       **Parameters**              **Returns**    **Description**
  ----------------------- --------------------------- -------------- ---------------------
  computePnL()            { from, to, compareFrom?,   { revenue,     Generates P&L data
                          compareTo? }                cogs,          from
                                                      grossProfit,   journal_entry_lines
                                                      expenses,      
                                                      netProfit,     
                                                      comparison? }  

  computeBalanceSheet()   { date }                    { assets,      Generates Balance
                                                      liabilities,   Sheet --- throws if
                                                      equity,        not balanced
                                                      balanced }     

  computeCashFlow()       { from, to }                { operating,   Generates Cash Flow
                                                      investing,     Statement
                                                      financing,     
                                                      netCash }      

  exportStatement()       { type, from, to }          { jobId }      Triggers a
                                                                     Trigger.dev export
                                                                     job --- returns job
                                                                     ID for status polling
  ----------------------------------------------------------------------------------------

**11.3 API Route Handlers**

  -----------------------------------------------------------------------------------------
  **Route**                            **Method**   **Purpose**               **Auth
                                                                              Required**
  ------------------------------------ ------------ ------------------------- -------------
  app/api/webhooks/trigger/route.ts    POST         Receives callbacks from   Trigger.dev
                                                    Trigger.dev jobs (export  secret header
                                                    complete, reminder sent)  

  app/api/webhooks/n8n/route.ts        POST         Receives inbound events   n8n shared
                                                    from n8n (e.g. customer   secret
                                                    placed WhatsApp order)    

  app/api/receipts/\[id\]/route.ts     GET          Returns PDF receipt for a Session
                                                    given order ID            required

  app/api/exports/\[jobId\]/route.ts   GET          Returns export file URL   Session
                                                    once Trigger.dev job      required
                                                    completes                 

  app/api/health/route.ts              GET          Health check endpoint for None
                                                    uptime monitoring         
  -----------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **SECTION 12: TRIGGER.DEV SCHEDULED JOBS & BACKGROUND TASKS**

  -----------------------------------------------------------------------

**12.1 Overview**

Trigger.dev is the dedicated background job and scheduled task platform
for TBH-IMS. All cron jobs, event-driven background tasks, and
long-running operations (such as PDF generation and WhatsApp dispatch)
are defined as Trigger.dev jobs in the /trigger/jobs/ directory of the
Next.js monorepo. Trigger.dev provides a real-time dashboard to monitor
job runs, view logs, retry failed jobs, and manage job schedules.

**12.2 Scheduled Cron Jobs**

  ----------------------------------------------------------------------------------
  **Job File**                **Schedule       **Description**    **Key Actions**
                              (WAT)**                             
  --------------------------- ---------------- ------------------ ------------------
  daily-summary.ts            Every day at     Daily sales and    Query today\'s
                              11:00pm          operational        orders from Turso,
                                               summary            compute revenue
                                                                  and order count,
                                                                  call n8n webhook
                                                                  to send WhatsApp
                                                                  summary to owner,
                                                                  append row to
                                                                  Google Sheets via
                                                                  n8n

  appointment-reminders.ts    Every day at     Send 24hr WhatsApp Query appointments
                              9:00am           reminders for      WHERE
                                               tomorrow\'s        appointment_date =
                                               appointments       tomorrow AND
                                                                  reminder_sent = 0,
                                                                  send WhatsApp via
                                                                  n8n for each,
                                                                  update
                                                                  reminder_sent = 1
                                                                  in Turso

  low-stock-check.ts          Every day at     Daily sweep for    Query all products
                              8:00am           products below     WHERE quantity \<=
                                               reorder level      reorder_level, for
                                                                  each low-stock
                                                                  product call n8n
                                                                  webhook to send
                                                                  owner WhatsApp
                                                                  alert

  monthly-statements.ts       1st of every     Auto-generate      Compute P&L and
                              month at 7:00am  previous month\'s  Balance Sheet for
                                               financial          prior month,
                                               statements         generate PDFs via
                                                                  react-pdf, upload
                                                                  to Cloudinary,
                                                                  email download
                                                                  links to owner via
                                                                  n8n

  monthly-close-reminder.ts   25th of every    Remind owner to    Send WhatsApp
                              month at 10:00am close and review   message via n8n:
                                               the month          \'Time to review
                                                                  and close
                                                                  \[Month\] --- log
                                                                  in to your finance
                                                                  dashboard\'

  weekly-analytics.ts         Every Monday at  Weekly performance Compute 7-day
                              9:00am           summary            revenue, top
                                                                  product, new
                                                                  customers, send
                                                                  formatted WhatsApp
                                                                  summary to owner
                                                                  via n8n
  ----------------------------------------------------------------------------------

**12.3 Event-Triggered Background Jobs**

  -----------------------------------------------------------------------------------------------
  **Job File**               **Trigger Event**         **Description**    **Key Actions**
  -------------------------- ------------------------- ------------------ -----------------------
  low-stock-alert.ts         \'inventory.low-stock\'   Fires immediately  Receive product details
                                                       when a product     from event payload,
                                                       hits its reorder   call n8n webhook with
                                                       level after a sale product name, SKU,
                                                                          current quantity ---
                                                                          n8n sends WhatsApp
                                                                          alert to owner

  export-statement.ts        \'export.statement\'      PDF/Excel export   Receive { type, from,
                                                       of a financial     to, userId } from
                                                       statement          event, compute
                                                                          statement data via
                                                                          finance.ts functions,
                                                                          render PDF with
                                                                          react-pdf, upload to
                                                                          Cloudinary, write
                                                                          export record to Turso,
                                                                          notify app via
                                                                          /api/webhooks/trigger

  order-notification.ts      \'order.confirmed\'       Post-sale          Receive order data,
                                                       notification and   call n8n webhook to
                                                       CRM sync           trigger WF04 (Order
                                                                          Confirmation Follow-Up)
                                                                          and WF06 (Broadcast
                                                                          List Auto-Builder) for
                                                                          the customer

  appointment-confirmed.ts   \'appointment.booked\'    Immediate booking  Receive appointment
                                                       confirmation to    details, call n8n
                                                       customer           webhook --- n8n sends
                                                                          WhatsApp confirmation
                                                                          to the customer: \'Your
                                                                          Glitz Nails appointment
                                                                          is confirmed for
                                                                          \[Date\] at \[Time\]\'
  -----------------------------------------------------------------------------------------------

**12.4 Trigger.dev Job Definition Pattern**

All Trigger.dev jobs follow this standard pattern in the Next.js
codebase:

  -----------------------------------------------------------------------
  **Example: low-stock-alert.ts**

  -----------------------------------------------------------------------

  ----------------------------------------------------------------------------------
  **Step**   **Code Location**                 **What Happens**
  ---------- --------------------------------- -------------------------------------
  1\. Define trigger/jobs/low-stock-alert.ts   Job defined with client.defineJob({
  the job                                      id: \'low-stock-alert\', name:
                                               \'\...\', version: \'1.0.0\',
                                               trigger: eventTrigger({ name:
                                               \'inventory.low-stock\' }) })

  2\. Fire   lib/actions/sales.ts --- after    await client.sendEvent({ name:
  the event  sale commit                       \'inventory.low-stock\', payload: {
                                               productId, productName, sku,
                                               currentQty, reorderLevel } })

  3\. Job    Trigger.dev cloud runner          Job runs in background, calls n8n
  executes                                     webhook URL with the payload

  4\.        Trigger.dev dashboard             Job run appears in dashboard with
  Monitor                                      status, logs, and duration

  5\. Retry  Automatic                         Trigger.dev automatically retries
  on failure                                   failed jobs with exponential backoff
                                               up to 3 times
  ----------------------------------------------------------------------------------

**12.5 Environment Variables for Trigger.dev**

  -----------------------------------------------------------------------------------------------
  **Variable**              **Value Source**              **Used In**
  ------------------------- ----------------------------- ---------------------------------------
  TRIGGER_API_KEY           Trigger.dev dashboard →       trigger/client.ts --- authenticates the
                            Project → API Keys            Trigger.dev client

  TRIGGER_API_URL           https://api.trigger.dev       trigger/client.ts
                            (default)                     

  N8N_WEBHOOK_BASE_URL      n8n instance webhook base URL trigger/jobs --- all jobs that call n8n

  N8N_LOW_STOCK_PATH        /webhook/low-stock            trigger/jobs/low-stock-alert.ts

  N8N_DAILY_SUMMARY_PATH    /webhook/daily-summary        trigger/jobs/daily-summary.ts

  N8N_MONTHLY_REPORT_PATH   /webhook/monthly-report       trigger/jobs/monthly-statements.ts

  N8N_ORDER_PATH            /webhook/order-confirmed      trigger/jobs/order-notification.ts

  N8N_APPOINTMENT_PATH      /webhook/appointment-booked   trigger/jobs/appointment-confirmed.ts
  -----------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **SECTION 13: n8n INTEGRATION PLAN**

  -----------------------------------------------------------------------

**13.1 Integration Architecture**

TBH-IMS does not call WhatsApp or external services directly. Instead,
all outbound notifications and automations are delegated to the existing
n8n automation stack via HTTP webhooks. Trigger.dev jobs act as the
bridge between TBH-IMS (the data source) and n8n (the automation layer).
This keeps the application clean and makes it easy to update automation
logic in n8n without touching the Next.js codebase.

  --------------------------------------------------------------------------------
  **TBH-IMS Event**   **Trigger.dev Job**        **n8n Workflow     **Outcome**
                                                 Called**           
  ------------------- -------------------------- ------------------ --------------
  Sale confirmed      order-notification.ts      WF04 + WF06        Order
                                                                    follow-up
                                                                    WhatsApp sent;
                                                                    customer added
                                                                    to VIP
                                                                    broadcast list

  Product hits        low-stock-alert.ts         New WF-A (Low      Owner receives
  reorder level                                  Stock Alert)       WhatsApp
                                                                    low-stock
                                                                    notification

  Appointment booked  appointment-confirmed.ts   New WF-B           Customer
                                                 (Appointment       receives
                                                 Confirmation)      booking
                                                                    confirmation
                                                                    WhatsApp

  Daily 11pm          daily-summary.ts           WF05 (Weekly       Daily revenue
                                                 Analytics ---      row added to
                                                 daily feed)        Google Sheets;
                                                                    owner summary
                                                                    WhatsApp sent

  Monthly 1st at 7am  monthly-statements.ts      New WF-C (Monthly  P&L and
                                                 Statements)        Balance Sheet
                                                                    PDFs emailed
                                                                    to owner

  Monday 9am          weekly-analytics.ts        WF05 (Weekly       7-day
                                                 Analytics)         performance
                                                                    summary
                                                                    WhatsApp to
                                                                    owner
  --------------------------------------------------------------------------------

**13.2 n8n Webhook Payload Contracts**

  -----------------------------------------------------------------------
  **Low Stock Alert Payload**

  -----------------------------------------------------------------------

  ------------------------------------------------------------------------
  **Field**          **Type**      **Example Value**
  ------------------ ------------- ---------------------------------------
  event              string        \'inventory.low-stock\'

  productId          string        \'prod_abc123\'

  productName        string        \'White Crop Top (M)\'

  sku                string        \'TT-CROP-WHT-M\'

  currentQty         number        2

  reorderLevel       number        3

  timestamp          string        \'2026-06-18T22:00:00+01:00\'
  ------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Order Confirmed Payload**

  -----------------------------------------------------------------------

  ------------------------------------------------------------------------
  **Field**          **Type**      **Example Value**
  ------------------ ------------- ---------------------------------------
  event              string        \'order.confirmed\'

  receiptNumber      string        \'TBH-0042\'

  customerName       string        \'Adaeze Okonkwo\'

  customerPhone      string        \'+2348012345678\'

  totalAmount        number        350000 (kobo --- ₦3,500)

  paymentMethod      string        \'transfer\'

  itemsCount         number        2

  timestamp          string        \'2026-06-18T14:30:00+01:00\'
  ------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **SECTION 14: IMPLEMENTATION ROADMAP**

  -----------------------------------------------------------------------

**14.1 Phased Development Plan**

  ----------------------------------------------------------------------------
  **Phase**   **Name**           **Timeline**   **Key Deliverables**
  ----------- ------------------ -------------- ------------------------------
  Phase 1     Foundation & MVP   Month 1--2     Next.js project setup, Turso +
                                                Drizzle schema, Auth.js
                                                authentication, product
                                                management, POS (sales
                                                recording), digital receipts,
                                                basic sales history

  Phase 2     Bookkeeping Module Month 3        Chart of accounts, automated
                                                journal entries, expense
                                                recording, general ledger
                                                view, bank reconciliation,
                                                period locking

  Phase 3     Financial          Month 4        P&L, Balance Sheet, Cash Flow
              Statements                        Statement, PDF/Excel export
                                                via Trigger.dev, multi-period
                                                comparison, analytics
                                                dashboard

  Phase 4     Automation &       Month 5--6     All Trigger.dev cron jobs, n8n
              Polish                            webhook integration,
                                                appointment system, supplier
                                                management, mobile PWA
                                                optimisation, staff onboarding
  ----------------------------------------------------------------------------

**14.2 Phase 1 --- Foundation & MVP (Months 1--2)**

  -----------------------------------------------------------------------
  **Week 1: Project Bootstrap**

  -----------------------------------------------------------------------

-   Create Next.js 14 app with App Router, Tailwind CSS, and shadcn/ui

-   Set up Turso database --- create production and development
    databases

-   Define initial Drizzle schema (users, products, categories, orders,
    order_items)

-   Run first migration: npx drizzle-kit migrate

-   Configure Auth.js with credentials provider and role-based
    middleware

-   Deploy to Vercel --- set TURSO_DATABASE_URL, TURSO_AUTH_TOKEN,
    NEXTAUTH_SECRET

  -----------------------------------------------------------------------
  **Week 2--4: Inventory Module**

  -----------------------------------------------------------------------

-   Product CRUD Server Actions + product list, add, and edit screens

-   Category management, business unit filter (thrift / nails)

-   Stock adjustment Server Action with reason logging

-   Low-stock flagging in the product list UI

  -----------------------------------------------------------------------
  **Week 5--7: POS & Sales**

  -----------------------------------------------------------------------

-   POS screen (Client Component) --- product selector, cart, payment

-   createSale() Server Action --- atomic Drizzle transaction for sale +
    stock + journal entries

-   Digital receipt modal with WhatsApp share button

-   Sales history screen (Server Component) with pagination

  -----------------------------------------------------------------------
  **Week 8: Testing & Go-Live**

  -----------------------------------------------------------------------

-   End-to-end testing of inventory and POS flows

-   Owner onboarding: import opening stock via CSV bulk upload

-   Staff training walkthrough (1 hour)

-   Phase 1 go-live --- owner begins using system for all daily sales

**14.3 Timeline & Effort Estimates**

  --------------------------------------------------------------------------------
  **Phase**         **Timeline**   **Frontend    **Backend / Server  **Testing**
                                   Effort**      Actions**           
  ----------------- -------------- ------------- ------------------- -------------
  Phase 1 --- MVP   8 weeks        35 hrs        45 hrs              15 hrs

  Phase 2 ---       4 weeks        20 hrs        35 hrs              15 hrs
  Bookkeeping                                                        

  Phase 3 ---       4 weeks        25 hrs        30 hrs              20 hrs
  Financial                                                          
  Statements                                                         

  Phase 4 ---       5 weeks        30 hrs        25 hrs              15 hrs
  Automation &                                                       
  Polish                                                             

  TOTAL             21 weeks       110 hrs       135 hrs             65 hrs
  --------------------------------------------------------------------------------

**14.4 MoSCoW Prioritisation**

  -----------------------------------------------------------------------
  **Priority**    **Features**
  --------------- -------------------------------------------------------
  Must Have (MVP) Product inventory tracking, POS sale recording, digital
                  receipts, automated journal entries from sales, Auth.js
                  authentication, Turso + Drizzle setup

  Should Have     Full bookkeeping (expenses, ledger, reconciliation),
                  P&L and Balance Sheet, appointment scheduling, supplier
                  management, Trigger.dev cron jobs

  Could Have      Cash Flow Statement, multi-period comparison, full
                  analytics dashboard, PDF/Excel export, bulk CSV import

  Won\'t Have     E-commerce storefront, multi-location support, payroll
  (v1)            module, customer loyalty points, native mobile app
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **SECTION 15: TESTING PLAN**

  -----------------------------------------------------------------------

**15.1 Unit Tests**

Unit tests use Vitest (compatible with Next.js) and cover individual
Server Action functions and business logic utilities:

  -----------------------------------------------------------------------
  **Test**                     **Expected Outcome**
  ---------------------------- ------------------------------------------
  createJournalEntry() with    Entry created successfully in Turso
  balanced lines               

  createJournalEntry() with    Throws \'Journal entry is unbalanced\'
  unbalanced lines             error --- no insert

  computePnL() with known      Revenue, COGS, Gross Profit, Expenses, Net
  transactions                 Profit match expected values

  computeBalanceSheet()        Total Assets === Total Liabilities +
  balance assertion            Equity --- no throw

  createSale() --- stock       Product quantity reduced by sold amount
  decrement                    after sale

  createSale() --- low stock   triggerEvent called with
  event fire                   \'inventory.low-stock\' when qty drops
                               below threshold

  adjustStock() --- negative   Stock reduced, movement log row created
  delta                        with reason

  lockPeriod() --- entry in    Subsequent Server Action attempting entry
  locked month                 in locked month is rejected
  -----------------------------------------------------------------------

**15.2 Integration Tests**

-   Full sale flow: POS → createSale() → order in Turso → inventory
    decremented → journal entries created → receipt returned

-   Refund flow: processRefund() → inventory restored → reversal journal
    entries created → original marked refunded

-   Appointment flow: bookAppointment() → calendar entry → Trigger.dev
    appointment-confirmed job fires → reminder_sent updated

-   Financial pipeline: 30 transactions inserted → computePnL() returns
    correct figures → computeBalanceSheet() returns balanced sheet

-   Trigger.dev integration: triggerEvent() called → job picked up
    within 5 seconds → n8n webhook called with correct payload

**15.3 UAT Test Cases**

  ------------------------------------------------------------------------
  **Test Case**      **Steps**              **Acceptance Criteria**
  ------------------ ---------------------- ------------------------------
  Record a cash      POS → select bodycon   Receipt shown, stock -1,
  thrift sale        top → Cash → Confirm   revenue journal entry in
                                            ledger

  Book nail          New Appointment → fill Appears in calendar, customer
  appointment        form → Save            WhatsApp number stored

  Record a business  Finance → New Expense  Expense in ledger, bank/cash
  expense            → Marketing → ₦5,000 → balance reduced by ₦5,000
                     Save                   

  Generate P&L       Finance → P&L → select Correct Revenue, Gross Profit,
                     current month          Net Profit displayed

  Export Balance     Finance → Balance      Trigger.dev job fires, PDF
  Sheet to PDF       Sheet → Export PDF     available within 30 seconds

  Low-stock WhatsApp Manually reduce stock  Owner receives WhatsApp within
  alert              to below reorder level 2 minutes

  Bank               Bookkeeping →          System identifies unreconciled
  reconciliation     Reconciliation → enter items
                     bank balance           
  ------------------------------------------------------------------------

**15.4 Financial Accuracy Validation**

-   Enter 30 known transactions covering all types (sales, expenses,
    purchases, adjustments)

-   Manually compute the expected P&L in a spreadsheet --- compare with
    computePnL() output: zero variance permitted

-   Verify computeBalanceSheet() returns balanced: Total Assets = Total
    Liabilities + Equity to the exact kobo

-   Reverse a journal entry --- verify all account balances return to
    pre-entry state

-   Attempt to enter a transaction in a locked period --- verify Server
    Action rejects it

  -----------------------------------------------------------------------
  **SECTION 16: RISKS & MITIGATIONS**

  -----------------------------------------------------------------------

  ------------------------------------------------------------------------------------
  **Risk**           **Category**   **Likelihood**   **Impact**   **Mitigation**
  ------------------ -------------- ---------------- ------------ --------------------
  Turso free tier    Technical      Low              Medium       Monitor usage in
  limits exceeded                                                 Turso dashboard;
  (9GB, 1B row                                                    free tier is ample
  reads)                                                          for years of small
                                                                  business data;
                                                                  upgrade to
                                                                  \$29/month Scaler
                                                                  plan if needed

  Vercel serverless  Technical      Medium           Low          Next.js App Router
  cold starts cause                                               streaming + Suspense
  slow initial load                                               boundaries means
                                                                  page shell loads
                                                                  instantly; data
                                                                  streams in
                                                                  progressively

  Trigger.dev job    Technical      Low              High         Trigger.dev
  fails silently (no                                              auto-retries failed
  WhatsApp sent)                                                  jobs 3x with
                                                                  backoff; all job
                                                                  runs visible in
                                                                  dashboard; owner can
                                                                  check missed jobs

  Poor mobile        Operational    High             Medium       POS Client Component
  internet causes                                                 uses optimistic
  POS failure                                                     updates + offline
  mid-sale                                                        Service Worker; sale
                                                                  queued locally and
                                                                  synced on reconnect

  Incorrect opening  Financial      Medium           High         Guided onboarding
  balances entered                                                wizard with
  at go-live                                                      validation;
                                                                  recommend accountant
                                                                  review before first
                                                                  month close

  Developer          Operational    Medium           High         Document all
  dependency --- no                                               patterns clearly in
  in-house Next.js                                                this SDD; use
  skills                                                          standard shadcn/ui
                                                                  and Drizzle
                                                                  patterns; Vercel
                                                                  deployment is one
                                                                  git push

  Turso connection   Technical      Low              Low          TBH-IMS uses 2
  limits on free                                                  databases
  tier (3 databases)                                              (production +
                                                                  development) ---
                                                                  within the free
                                                                  limit

  Auth.js session    Technical      Low              Medium       POS form state
  expiry causes data                                              stored in
  loss in POS                                                     sessionStorage; on
                                                                  session expiry,
                                                                  redirect to login
                                                                  and restore cart
                                                                  state on return
  ------------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **SECTION 17: APPENDIX**

  -----------------------------------------------------------------------

**17.1 Environment Variables Reference**

All environment variables must be set in Vercel\'s Environment Variables
panel for production and in a .env.local file for local development:

  --------------------------------------------------------------------------------
  **Variable**             **Description**           **Where to Get**
  ------------------------ ------------------------- -----------------------------
  TURSO_DATABASE_URL       libSQL connection URL for Turso dashboard → Database →
                           the Turso production      Connect
                           database                  

  TURSO_AUTH_TOKEN         Authentication token for  Turso dashboard → Database →
                           Turso database access     Connect

  NEXTAUTH_SECRET          Random secret string for  Generate with: openssl rand
                           Auth.js session           -base64 32
                           encryption                

  NEXTAUTH_URL             Full URL of the deployed  e.g.
                           app                       https://tams-ims.vercel.app

  TRIGGER_API_KEY          API key for Trigger.dev   Trigger.dev dashboard →
                           job execution             Project → API Keys

  CLOUDINARY_CLOUD_NAME    Cloudinary cloud name for Cloudinary dashboard →
                           image/PDF storage         Settings

  CLOUDINARY_API_KEY       Cloudinary API key        Cloudinary dashboard →
                                                     Settings

  CLOUDINARY_API_SECRET    Cloudinary API secret     Cloudinary dashboard →
                                                     Settings

  N8N_WEBHOOK_BASE_URL     Base URL of the n8n       n8n instance URL
                           instance                  

  N8N_WEBHOOK_SECRET       Shared secret for         Set in both n8n and here
                           validating n8n webhook    
                           calls                     
  --------------------------------------------------------------------------------

**17.2 Drizzle Schema Quick Reference**

  -------------------------------------------------------------------------------
  **Table**             **Primary Key      **Monetary         **Notes**
                        Type**             Fields**           
  --------------------- ------------------ ------------------ -------------------
  products              text UUID          costPrice,         businessUnit:
                                           sellingPrice       \'thrift\' \|
                                           (integer kobo)     \'nails\'

  categories            text UUID          ---                name, businessUnit

  orders                text UUID          subtotal,          receiptNumber
                                           discount, total,   auto-generated:
                                           amountPaid,        TBH-XXXX
                                           balanceDue (kobo)  

  order_items           text UUID          unitPrice,         FK to orders +
                                           totalPrice (kobo)  products

  stock_movements       text UUID          ---                productId, delta,
                                                              reason, createdBy

  customers             text UUID          ---                name, phone, email,
                                                              totalSpend

  appointments          text UUID          priceCharged       status enum,
                                           (kobo)             reminderSent
                                                              integer (0/1)

  services              text UUID          price (kobo)       name, duration
                                                              (minutes),
                                                              materialsConsumed

  suppliers             text UUID          ---                name, contact,
                                                              phone, categories

  purchase_orders       text UUID          totalAmount (kobo) status enum,
                                                              supplierId FK

  accounts              text UUID          balance (kobo)     code, name, type
                                                              enum, normalBalance

  journal_entries       text UUID          ---                entryNumber,
                                                              referenceType,
                                                              isReversed

  journal_entry_lines   text UUID          amount (kobo)      FK to
                                                              journal_entries +
                                                              accounts, entryType

  expenses              text UUID          amount (kobo)      accountId FK,
                                                              receiptUrl, date

  period_locks          text UUID          ---                year INTEGER, month
                                                              INTEGER, lockedBy
                                                              FK
  -------------------------------------------------------------------------------

**17.3 Complete Chart of Accounts**

  ------------------------------------------------------------------------
  **Code**   **Account Name**         **Type**      **Normal Balance**
  ---------- ------------------------ ------------- ----------------------
  1000       Cash --- On Hand         Asset         Debit

  1010       Bank Account --- GTBank  Asset         Debit

  1100       Accounts Receivable      Asset         Debit

  1200       Thrift Inventory         Asset         Debit

  1210       Nail Supplies Inventory  Asset         Debit

  1300       Prepaid Expenses         Asset         Debit

  2000       Accounts Payable         Liability     Credit

  2100       VAT Payable              Liability     Credit

  2200       Accrued Expenses         Liability     Credit

  3000       Owner\'s Equity /        Equity        Credit
             Capital                                

  3100       Retained Earnings        Equity        Credit

  3200       Owner\'s Drawings        Equity        Debit

  4000       Thrift Sales Revenue     Income        Credit

  4100       Nail Services Revenue    Income        Credit

  4200       Other Income             Income        Credit

  5000       Cost of Goods Sold ---   COGS          Debit
             Thrift                                 

  5100       Nail Supplies Consumed   COGS          Debit

  6000       Rent & Utilities         Expense       Debit

  6100       Transport & Delivery     Expense       Debit

  6200       Marketing & Advertising  Expense       Debit

  6300       Packaging & Supplies     Expense       Debit

  6400       Platform & Software Fees Expense       Debit

  6500       Miscellaneous Expenses   Expense       Debit
  ------------------------------------------------------------------------

**17.4 Reference Documents**

-   Tams Beauty Hub Marketing, Customer Journey & Lead Generation
    Document --- June 2026

-   n8n Automation Workflows Pack --- TAMS_n8n_Workflows.zip --- June
    2026

-   Next.js 14 App Router Documentation --- nextjs.org/docs

-   Turso Documentation --- docs.turso.tech

-   Drizzle ORM Documentation --- orm.drizzle.team

-   Trigger.dev Documentation --- trigger.dev/docs

-   Auth.js (NextAuth v5) Documentation --- authjs.dev

-   Nigerian Financial Reporting Standards for SMEs --- FRCN

─────────────────────────────────────

**TAMS BEAUTY HUB**

*--- Selling Confidence and Luxury on a Budget ---*

SDD v2.0 \| Next.js · Turso · Drizzle ORM · Trigger.dev \| June 2026 \|
Confidential
