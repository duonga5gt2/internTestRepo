--
-- PostgreSQL database dump
--

\restrict rzc9IDUgWgIQHUidw5S3Fg0f4bvWVq083brson2Ehw5t4gTao6GCffkdYztTNq7

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: realestate; Type: SCHEMA; Schema: -; Owner: myuser
--

CREATE SCHEMA realestate;


ALTER SCHEMA realestate OWNER TO myuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appraisals; Type: TABLE; Schema: realestate; Owner: myuser
--

CREATE TABLE realestate.appraisals (
    id bigint NOT NULL,
    contact_id bigint NOT NULL,
    property_id bigint NOT NULL,
    appraisal_type text NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    status text DEFAULT 'BOOKED'::text,
    motivation text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT appraisals_appraisal_type_check CHECK ((appraisal_type = ANY (ARRAY['SELLER'::text, 'LANDLORD'::text]))),
    CONSTRAINT appraisals_status_check CHECK ((status = ANY (ARRAY['BOOKED'::text, 'CANCELLED'::text, 'COMPLETED'::text])))
);


ALTER TABLE realestate.appraisals OWNER TO myuser;

--
-- Name: appraisals_id_seq; Type: SEQUENCE; Schema: realestate; Owner: myuser
--

CREATE SEQUENCE realestate.appraisals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE realestate.appraisals_id_seq OWNER TO myuser;

--
-- Name: appraisals_id_seq; Type: SEQUENCE OWNED BY; Schema: realestate; Owner: myuser
--

ALTER SEQUENCE realestate.appraisals_id_seq OWNED BY realestate.appraisals.id;


--
-- Name: call_logs; Type: TABLE; Schema: realestate; Owner: myuser
--

CREATE TABLE realestate.call_logs (
    id bigint NOT NULL,
    external_call_id text,
    contact_id bigint,
    property_id bigint,
    call_type text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    transcript text,
    ai_summary text,
    outcome text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE realestate.call_logs OWNER TO myuser;

--
-- Name: call_logs_id_seq; Type: SEQUENCE; Schema: realestate; Owner: myuser
--

CREATE SEQUENCE realestate.call_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE realestate.call_logs_id_seq OWNER TO myuser;

--
-- Name: call_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: realestate; Owner: myuser
--

ALTER SEQUENCE realestate.call_logs_id_seq OWNED BY realestate.call_logs.id;


--
-- Name: contacts; Type: TABLE; Schema: realestate; Owner: myuser
--

CREATE TABLE realestate.contacts (
    id bigint NOT NULL,
    full_name text NOT NULL,
    mobile text NOT NULL,
    email text,
    lead_type text DEFAULT 'OTHER'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contacts_lead_type_check CHECK ((lead_type = ANY (ARRAY['BUYER'::text, 'SELLER'::text, 'LANDLORD'::text, 'TENANT'::text, 'OTHER'::text])))
);


ALTER TABLE realestate.contacts OWNER TO myuser;

--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: realestate; Owner: myuser
--

CREATE SEQUENCE realestate.contacts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE realestate.contacts_id_seq OWNER TO myuser;

--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: realestate; Owner: myuser
--

ALTER SEQUENCE realestate.contacts_id_seq OWNED BY realestate.contacts.id;


--
-- Name: inspections; Type: TABLE; Schema: realestate; Owner: myuser
--

CREATE TABLE realestate.inspections (
    id bigint NOT NULL,
    contact_id bigint NOT NULL,
    property_id bigint NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    status text DEFAULT 'BOOKED'::text,
    source text DEFAULT 'AI_CALL'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inspections_status_check CHECK ((status = ANY (ARRAY['BOOKED'::text, 'CANCELLED'::text, 'ATTENDED'::text, 'NO_SHOW'::text])))
);


ALTER TABLE realestate.inspections OWNER TO myuser;

--
-- Name: inspections_id_seq; Type: SEQUENCE; Schema: realestate; Owner: myuser
--

CREATE SEQUENCE realestate.inspections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE realestate.inspections_id_seq OWNER TO myuser;

--
-- Name: inspections_id_seq; Type: SEQUENCE OWNED BY; Schema: realestate; Owner: myuser
--

ALTER SEQUENCE realestate.inspections_id_seq OWNED BY realestate.inspections.id;


--
-- Name: leads; Type: TABLE; Schema: realestate; Owner: myuser
--

CREATE TABLE realestate.leads (
    id bigint NOT NULL,
    contact_id bigint NOT NULL,
    property_id bigint,
    lead_type text NOT NULL,
    source text,
    status text DEFAULT 'OPEN'::text,
    summary text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT leads_lead_type_check CHECK ((lead_type = ANY (ARRAY['BUYER'::text, 'SELLER'::text, 'LANDLORD'::text, 'TENANT'::text, 'OTHER'::text])))
);


ALTER TABLE realestate.leads OWNER TO myuser;

--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: realestate; Owner: myuser
--

CREATE SEQUENCE realestate.leads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE realestate.leads_id_seq OWNER TO myuser;

--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: realestate; Owner: myuser
--

ALTER SEQUENCE realestate.leads_id_seq OWNED BY realestate.leads.id;


--
-- Name: maintenance_requests; Type: TABLE; Schema: realestate; Owner: myuser
--

CREATE TABLE realestate.maintenance_requests (
    id bigint NOT NULL,
    contact_id bigint,
    property_id bigint,
    caller_role text DEFAULT 'TENANT'::text,
    description text NOT NULL,
    urgency text DEFAULT 'MEDIUM'::text,
    status text DEFAULT 'OPEN'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT maintenance_requests_caller_role_check CHECK ((caller_role = ANY (ARRAY['TENANT'::text, 'LANDLORD'::text, 'OTHER'::text]))),
    CONSTRAINT maintenance_requests_status_check CHECK ((status = ANY (ARRAY['OPEN'::text, 'IN_PROGRESS'::text, 'COMPLETED'::text, 'CANCELLED'::text]))),
    CONSTRAINT maintenance_requests_urgency_check CHECK ((urgency = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'EMERGENCY'::text])))
);


ALTER TABLE realestate.maintenance_requests OWNER TO myuser;

--
-- Name: maintenance_requests_id_seq; Type: SEQUENCE; Schema: realestate; Owner: myuser
--

CREATE SEQUENCE realestate.maintenance_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE realestate.maintenance_requests_id_seq OWNER TO myuser;

--
-- Name: maintenance_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: realestate; Owner: myuser
--

ALTER SEQUENCE realestate.maintenance_requests_id_seq OWNED BY realestate.maintenance_requests.id;


--
-- Name: notes; Type: TABLE; Schema: realestate; Owner: myuser
--

CREATE TABLE realestate.notes (
    id bigint NOT NULL,
    contact_id bigint,
    property_id bigint,
    related_table text,
    related_id bigint,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE realestate.notes OWNER TO myuser;

--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: realestate; Owner: myuser
--

CREATE SEQUENCE realestate.notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE realestate.notes_id_seq OWNER TO myuser;

--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: realestate; Owner: myuser
--

ALTER SEQUENCE realestate.notes_id_seq OWNED BY realestate.notes.id;


--
-- Name: open_home_reminders; Type: TABLE; Schema: realestate; Owner: myuser
--

CREATE TABLE realestate.open_home_reminders (
    id bigint NOT NULL,
    contact_id bigint NOT NULL,
    property_id bigint NOT NULL,
    open_time timestamp with time zone NOT NULL,
    reminder_time timestamp with time zone NOT NULL,
    status text DEFAULT 'ACTIVE'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT open_home_reminders_status_check CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'CANCELLED'::text, 'SENT'::text])))
);


ALTER TABLE realestate.open_home_reminders OWNER TO myuser;

--
-- Name: open_home_reminders_id_seq; Type: SEQUENCE; Schema: realestate; Owner: myuser
--

CREATE SEQUENCE realestate.open_home_reminders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE realestate.open_home_reminders_id_seq OWNER TO myuser;

--
-- Name: open_home_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: realestate; Owner: myuser
--

ALTER SEQUENCE realestate.open_home_reminders_id_seq OWNED BY realestate.open_home_reminders.id;


--
-- Name: properties; Type: TABLE; Schema: realestate; Owner: myuser
--

CREATE TABLE realestate.properties (
    id bigint NOT NULL,
    address_line1 text NOT NULL,
    suburb text NOT NULL,
    state text NOT NULL,
    postcode text NOT NULL,
    property_type text,
    bedrooms integer,
    bathrooms integer,
    car_spaces integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE realestate.properties OWNER TO myuser;

--
-- Name: properties_id_seq; Type: SEQUENCE; Schema: realestate; Owner: myuser
--

CREATE SEQUENCE realestate.properties_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE realestate.properties_id_seq OWNER TO myuser;

--
-- Name: properties_id_seq; Type: SEQUENCE OWNED BY; Schema: realestate; Owner: myuser
--

ALTER SEQUENCE realestate.properties_id_seq OWNED BY realestate.properties.id;


--
-- Name: tasks; Type: TABLE; Schema: realestate; Owner: myuser
--

CREATE TABLE realestate.tasks (
    id bigint NOT NULL,
    assignee text,
    contact_id bigint,
    property_id bigint,
    title text NOT NULL,
    description text,
    due_at timestamp with time zone,
    status text DEFAULT 'OPEN'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['OPEN'::text, 'IN_PROGRESS'::text, 'DONE'::text, 'CANCELLED'::text])))
);


ALTER TABLE realestate.tasks OWNER TO myuser;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: realestate; Owner: myuser
--

CREATE SEQUENCE realestate.tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE realestate.tasks_id_seq OWNER TO myuser;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: realestate; Owner: myuser
--

ALTER SEQUENCE realestate.tasks_id_seq OWNED BY realestate.tasks.id;


--
-- Name: appraisals id; Type: DEFAULT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.appraisals ALTER COLUMN id SET DEFAULT nextval('realestate.appraisals_id_seq'::regclass);


--
-- Name: call_logs id; Type: DEFAULT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.call_logs ALTER COLUMN id SET DEFAULT nextval('realestate.call_logs_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.contacts ALTER COLUMN id SET DEFAULT nextval('realestate.contacts_id_seq'::regclass);


--
-- Name: inspections id; Type: DEFAULT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.inspections ALTER COLUMN id SET DEFAULT nextval('realestate.inspections_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.leads ALTER COLUMN id SET DEFAULT nextval('realestate.leads_id_seq'::regclass);


--
-- Name: maintenance_requests id; Type: DEFAULT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.maintenance_requests ALTER COLUMN id SET DEFAULT nextval('realestate.maintenance_requests_id_seq'::regclass);


--
-- Name: notes id; Type: DEFAULT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.notes ALTER COLUMN id SET DEFAULT nextval('realestate.notes_id_seq'::regclass);


--
-- Name: open_home_reminders id; Type: DEFAULT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.open_home_reminders ALTER COLUMN id SET DEFAULT nextval('realestate.open_home_reminders_id_seq'::regclass);


--
-- Name: properties id; Type: DEFAULT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.properties ALTER COLUMN id SET DEFAULT nextval('realestate.properties_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.tasks ALTER COLUMN id SET DEFAULT nextval('realestate.tasks_id_seq'::regclass);


--
-- Data for Name: appraisals; Type: TABLE DATA; Schema: realestate; Owner: myuser
--

COPY realestate.appraisals (id, contact_id, property_id, appraisal_type, scheduled_at, status, motivation, notes, created_at, updated_at) FROM stdin;
1	2	2	SELLER	2025-12-01 07:00:00+00	BOOKED	Upsizing to larger home in inner west.	Evening appraisal requested; flexible +/- 30 minutes.	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
2	3	3	LANDLORD	2025-11-28 05:00:00+00	BOOKED	Wants rental appraisal and management proposal.	Prefers email follow-up with fee schedule.	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
3	2	2	SELLER	2025-12-01 07:00:00+00	BOOKED	Upsizing to a bigger home	Prefers early evening appointments.	2025-11-22 03:44:34.394869+00	2025-11-22 03:44:34.394869+00
\.


--
-- Data for Name: call_logs; Type: TABLE DATA; Schema: realestate; Owner: myuser
--

COPY realestate.call_logs (id, external_call_id, contact_id, property_id, call_type, started_at, ended_at, transcript, ai_summary, outcome, created_at) FROM stdin;
1	CALL-0001	1	1	INSPECTION_BOOKING	2025-11-24 23:01:00+00	2025-11-24 23:05:00+00	Caller: wants to inspect 12 Smith St on Saturday at 11am. AI confirmed details.	Booked inspection for John Nguyen at 11am Saturday for 12 Smith St.	BOOKED_INSPECTION	2025-11-22 02:46:11.29766+00
2	CALL-0002	2	2	SELLER_APPRAISAL	2025-11-25 00:15:00+00	2025-11-25 00:20:00+00	Caller: owner of 5 George St wanting appraisal next week after work.	Booked seller appraisal for Sarah Lee at 6pm 1 Dec for 5 George St.	BOOKED_APPRAISAL	2025-11-22 02:46:11.29766+00
3	CALL-0003	4	3	RENTAL_MAINTENANCE	2025-11-25 01:30:00+00	2025-11-25 01:34:00+00	Caller: tenant at 5/20 King St with no hot water; AI logged high-urgency job.	Created high-urgency maintenance request for hot water at 5/20 King St.	MAINTENANCE_LOGGED	2025-11-22 02:46:11.29766+00
4	CALL-TEST-001	1	1	INSPECTION_BOOKING	2025-11-24 23:01:00+00	2025-11-24 23:05:00+00	Caller wants to inspect 12 Smith Street on Saturday at 11am.	Booked inspection for John at 11am Saturday for 12 Smith Street.	BOOKED_INSPECTION	2025-11-22 03:50:38.013372+00
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: realestate; Owner: myuser
--

COPY realestate.contacts (id, full_name, mobile, email, lead_type, created_at, updated_at) FROM stdin;
3	Mark Davis	0400 333 333	mark.davis@example.com	LANDLORD	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
2	Sarah Lee	0400 222 222	sarah.lee@example.com	SELLER	2025-11-22 02:46:11.29766+00	2025-11-22 03:44:34.394869+00
1	John Nguyen	0400 111 111	john.nguyen@example.com	OTHER	2025-11-22 02:46:11.29766+00	2025-11-22 03:50:38.013372+00
5	Lisa Brown	0400 555 555	lisa.brown@example.com	BUYER	2025-11-22 02:46:11.29766+00	2025-11-22 03:52:47.747235+00
4	Emma Chan	0400 444 444	emma.chan@example.com	TENANT	2025-11-22 02:46:11.29766+00	2025-11-22 03:55:56.204988+00
\.


--
-- Data for Name: inspections; Type: TABLE DATA; Schema: realestate; Owner: myuser
--

COPY realestate.inspections (id, contact_id, property_id, scheduled_at, status, source, notes, created_at, updated_at) FROM stdin;
1	1	1	2025-11-29 00:00:00+00	BOOKED	AI_CALL	Booked by AI: first inspection for John Nguyen.	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
2	5	1	2025-11-30 03:30:00+00	BOOKED	AI_CALL	Second buyer (Lisa Brown) inspecting 12 Smith Street.	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
3	1	1	2025-11-29 00:00:00+00	BOOKED	AI_CALL	Prefers Saturday morning.	2025-11-22 03:42:24.672761+00	2025-11-22 03:42:24.672761+00
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: realestate; Owner: myuser
--

COPY realestate.leads (id, contact_id, property_id, lead_type, source, status, summary, created_at, updated_at) FROM stdin;
1	1	1	BUYER	AI_CALL	OPEN	Buyer interested in inspecting 12 Smith Street (budget ~1.4M).	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
2	2	2	SELLER	AI_CALL	OPEN	Owner of 5 George Street wants a selling appraisal.	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
3	3	3	LANDLORD	AI_CALL	OPEN	Landlord wants to rent out 5/20 King Street.	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
4	4	3	TENANT	AI_CALL	OPEN	Tenant reporting hot water not working at 5/20 King Street.	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
5	1	1	BUYER	AI_CALL	OPEN	Prefers Saturday morning.	2025-11-22 03:42:24.672761+00	2025-11-22 03:42:24.672761+00
6	2	2	SELLER	AI_CALL	OPEN	Upsizing to a bigger home	2025-11-22 03:44:34.394869+00	2025-11-22 03:44:34.394869+00
\.


--
-- Data for Name: maintenance_requests; Type: TABLE DATA; Schema: realestate; Owner: myuser
--

COPY realestate.maintenance_requests (id, contact_id, property_id, caller_role, description, urgency, status, created_at, updated_at) FROM stdin;
1	4	3	TENANT	Hot water system not working since last night.	HIGH	OPEN	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
2	4	3	TENANT	Leaking tap in kitchen; minor but ongoing.	LOW	OPEN	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
3	4	3	TENANT	Hot water system not working since last night	HIGH	OPEN	2025-11-22 03:48:05.728762+00	2025-11-22 03:48:05.728762+00
4	4	3	TENANT	Hot water system not working since last night	HIGH	OPEN	2025-11-22 03:55:56.204988+00	2025-11-22 03:55:56.204988+00
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: realestate; Owner: myuser
--

COPY realestate.notes (id, contact_id, property_id, related_table, related_id, body, created_at) FROM stdin;
1	1	1	inspections	1	Buyer liked photos online; wants to check street noise.	2025-11-22 02:46:11.29766+00
2	2	2	appraisals	1	Seller is flexible on timing, prefers experienced agent.	2025-11-22 02:46:11.29766+00
3	4	3	maintenance_requests	1	Tenant has small children; hot water issue flagged as urgent.	2025-11-22 02:46:11.29766+00
\.


--
-- Data for Name: open_home_reminders; Type: TABLE DATA; Schema: realestate; Owner: myuser
--

COPY realestate.open_home_reminders (id, contact_id, property_id, open_time, reminder_time, status, created_at, updated_at) FROM stdin;
1	1	1	2025-11-30 00:00:00+00	2025-11-29 23:00:00+00	ACTIVE	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
2	5	1	2025-11-30 00:00:00+00	2025-11-29 22:00:00+00	ACTIVE	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
3	5	1	2025-11-30 00:00:00+00	2025-11-29 23:00:00+00	ACTIVE	2025-11-22 03:52:47.747235+00	2025-11-22 03:52:47.747235+00
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: realestate; Owner: myuser
--

COPY realestate.properties (id, address_line1, suburb, state, postcode, property_type, bedrooms, bathrooms, car_spaces, created_at, updated_at) FROM stdin;
2	5 George Street	Newtown	NSW	2042	HOUSE	4	2	2	2025-11-22 02:46:11.29766+00	2025-11-22 03:44:34.394869+00
1	12 Smith Street	Marrickville	NSW	2204	HOUSE	3	2	1	2025-11-22 02:46:11.29766+00	2025-11-22 03:52:47.747235+00
3	5/20 King Street	Newtown	NSW	2042	APARTMENT	2	1	1	2025-11-22 02:46:11.29766+00	2025-11-22 03:55:56.204988+00
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: realestate; Owner: myuser
--

COPY realestate.tasks (id, assignee, contact_id, property_id, title, description, due_at, status, created_at, updated_at) FROM stdin;
1	young.agent@example.com	1	1	Call John after inspection	Follow up with John Nguyen after Saturday inspection for feedback.	2025-11-30 06:00:00+00	OPEN	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
2	pm.team@example.com	4	3	Update tenant on plumber ETA	Call Emma to confirm plumber booking for hot water issue.	2025-11-25 22:00:00+00	OPEN	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
3	sales.manager@example.com	2	2	Prepare CMA for Sarah Lee	Prepare comparative market analysis for 5 George St before appraisal.	2025-11-30 01:00:00+00	OPEN	2025-11-22 02:46:11.29766+00	2025-11-22 02:46:11.29766+00
\.


--
-- Name: appraisals_id_seq; Type: SEQUENCE SET; Schema: realestate; Owner: myuser
--

SELECT pg_catalog.setval('realestate.appraisals_id_seq', 3, true);


--
-- Name: call_logs_id_seq; Type: SEQUENCE SET; Schema: realestate; Owner: myuser
--

SELECT pg_catalog.setval('realestate.call_logs_id_seq', 4, true);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: realestate; Owner: myuser
--

SELECT pg_catalog.setval('realestate.contacts_id_seq', 5, true);


--
-- Name: inspections_id_seq; Type: SEQUENCE SET; Schema: realestate; Owner: myuser
--

SELECT pg_catalog.setval('realestate.inspections_id_seq', 3, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: realestate; Owner: myuser
--

SELECT pg_catalog.setval('realestate.leads_id_seq', 6, true);


--
-- Name: maintenance_requests_id_seq; Type: SEQUENCE SET; Schema: realestate; Owner: myuser
--

SELECT pg_catalog.setval('realestate.maintenance_requests_id_seq', 4, true);


--
-- Name: notes_id_seq; Type: SEQUENCE SET; Schema: realestate; Owner: myuser
--

SELECT pg_catalog.setval('realestate.notes_id_seq', 3, true);


--
-- Name: open_home_reminders_id_seq; Type: SEQUENCE SET; Schema: realestate; Owner: myuser
--

SELECT pg_catalog.setval('realestate.open_home_reminders_id_seq', 3, true);


--
-- Name: properties_id_seq; Type: SEQUENCE SET; Schema: realestate; Owner: myuser
--

SELECT pg_catalog.setval('realestate.properties_id_seq', 3, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: realestate; Owner: myuser
--

SELECT pg_catalog.setval('realestate.tasks_id_seq', 3, true);


--
-- Name: appraisals appraisals_pkey; Type: CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.appraisals
    ADD CONSTRAINT appraisals_pkey PRIMARY KEY (id);


--
-- Name: call_logs call_logs_pkey; Type: CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.call_logs
    ADD CONSTRAINT call_logs_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: open_home_reminders open_home_reminders_pkey; Type: CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.open_home_reminders
    ADD CONSTRAINT open_home_reminders_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: idx_appraisals_property_time; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE INDEX idx_appraisals_property_time ON realestate.appraisals USING btree (property_id, scheduled_at);


--
-- Name: idx_call_logs_contact; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE INDEX idx_call_logs_contact ON realestate.call_logs USING btree (contact_id);


--
-- Name: idx_contacts_email; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE INDEX idx_contacts_email ON realestate.contacts USING btree (email);


--
-- Name: idx_contacts_mobile; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE INDEX idx_contacts_mobile ON realestate.contacts USING btree (mobile);


--
-- Name: idx_inspections_property_time; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE INDEX idx_inspections_property_time ON realestate.inspections USING btree (property_id, scheduled_at);


--
-- Name: idx_leads_contact; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE INDEX idx_leads_contact ON realestate.leads USING btree (contact_id);


--
-- Name: idx_leads_property; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE INDEX idx_leads_property ON realestate.leads USING btree (property_id);


--
-- Name: idx_maintenance_status; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE INDEX idx_maintenance_status ON realestate.maintenance_requests USING btree (status);


--
-- Name: idx_open_home_reminders_due; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE INDEX idx_open_home_reminders_due ON realestate.open_home_reminders USING btree (reminder_time, status);


--
-- Name: idx_properties_unique_address; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE UNIQUE INDEX idx_properties_unique_address ON realestate.properties USING btree (address_line1, suburb, state, postcode);


--
-- Name: idx_tasks_status_due; Type: INDEX; Schema: realestate; Owner: myuser
--

CREATE INDEX idx_tasks_status_due ON realestate.tasks USING btree (status, due_at);


--
-- Name: appraisals appraisals_contact_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.appraisals
    ADD CONSTRAINT appraisals_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES realestate.contacts(id) ON DELETE CASCADE;


--
-- Name: appraisals appraisals_property_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.appraisals
    ADD CONSTRAINT appraisals_property_id_fkey FOREIGN KEY (property_id) REFERENCES realestate.properties(id) ON DELETE CASCADE;


--
-- Name: call_logs call_logs_contact_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.call_logs
    ADD CONSTRAINT call_logs_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES realestate.contacts(id) ON DELETE SET NULL;


--
-- Name: call_logs call_logs_property_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.call_logs
    ADD CONSTRAINT call_logs_property_id_fkey FOREIGN KEY (property_id) REFERENCES realestate.properties(id) ON DELETE SET NULL;


--
-- Name: inspections inspections_contact_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.inspections
    ADD CONSTRAINT inspections_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES realestate.contacts(id) ON DELETE CASCADE;


--
-- Name: inspections inspections_property_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.inspections
    ADD CONSTRAINT inspections_property_id_fkey FOREIGN KEY (property_id) REFERENCES realestate.properties(id) ON DELETE CASCADE;


--
-- Name: leads leads_contact_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.leads
    ADD CONSTRAINT leads_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES realestate.contacts(id) ON DELETE CASCADE;


--
-- Name: leads leads_property_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.leads
    ADD CONSTRAINT leads_property_id_fkey FOREIGN KEY (property_id) REFERENCES realestate.properties(id) ON DELETE SET NULL;


--
-- Name: maintenance_requests maintenance_requests_contact_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.maintenance_requests
    ADD CONSTRAINT maintenance_requests_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES realestate.contacts(id) ON DELETE SET NULL;


--
-- Name: maintenance_requests maintenance_requests_property_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.maintenance_requests
    ADD CONSTRAINT maintenance_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES realestate.properties(id) ON DELETE SET NULL;


--
-- Name: notes notes_contact_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.notes
    ADD CONSTRAINT notes_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES realestate.contacts(id) ON DELETE SET NULL;


--
-- Name: notes notes_property_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.notes
    ADD CONSTRAINT notes_property_id_fkey FOREIGN KEY (property_id) REFERENCES realestate.properties(id) ON DELETE SET NULL;


--
-- Name: open_home_reminders open_home_reminders_contact_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.open_home_reminders
    ADD CONSTRAINT open_home_reminders_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES realestate.contacts(id) ON DELETE CASCADE;


--
-- Name: open_home_reminders open_home_reminders_property_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.open_home_reminders
    ADD CONSTRAINT open_home_reminders_property_id_fkey FOREIGN KEY (property_id) REFERENCES realestate.properties(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_contact_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.tasks
    ADD CONSTRAINT tasks_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES realestate.contacts(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_property_id_fkey; Type: FK CONSTRAINT; Schema: realestate; Owner: myuser
--

ALTER TABLE ONLY realestate.tasks
    ADD CONSTRAINT tasks_property_id_fkey FOREIGN KEY (property_id) REFERENCES realestate.properties(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict rzc9IDUgWgIQHUidw5S3Fg0f4bvWVq083brson2Ehw5t4gTao6GCffkdYztTNq7

