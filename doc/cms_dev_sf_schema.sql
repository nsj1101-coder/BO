--
-- PostgreSQL database dump
--

\restrict gPzG0du3auwCo4lGiEfHuGKolACgShqLPRCa2xXjgfhtGnGAPvmccUAjfZj31hV

-- Dumped from database version 17.9 (Homebrew)
-- Dumped by pg_dump version 17.9 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.admin_logs (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    action text NOT NULL,
    detail text DEFAULT ''::text NOT NULL,
    ip text DEFAULT ''::text NOT NULL,
    user_agent text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.admin_logs OWNER TO j;

--
-- Name: admin_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.admin_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_logs_id_seq OWNER TO j;

--
-- Name: admin_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.admin_logs_id_seq OWNED BY public.admin_logs.id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    login_id text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    can_manage_admins boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    permissions text DEFAULT 'all'::text NOT NULL
);


ALTER TABLE public.admins OWNER TO j;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO j;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: banners; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.banners (
    id integer NOT NULL,
    template_id integer NOT NULL,
    slot_key text NOT NULL,
    image_url text NOT NULL,
    link_url text,
    alt_text text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.banners OWNER TO j;

--
-- Name: banners_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.banners_id_seq OWNER TO j;

--
-- Name: banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.banners_id_seq OWNED BY public.banners.id;


--
-- Name: boards; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.boards (
    id integer NOT NULL,
    name text NOT NULL,
    board_id text NOT NULL,
    board_type text DEFAULT 'list'::text NOT NULL,
    is_secret boolean DEFAULT false NOT NULL,
    use_comment boolean DEFAULT true NOT NULL,
    write_role text DEFAULT 'admin'::text NOT NULL,
    list_role text DEFAULT 'all'::text NOT NULL,
    read_role text DEFAULT 'all'::text NOT NULL,
    comment_role text DEFAULT 'all'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    custom_css text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.boards OWNER TO j;

--
-- Name: boards_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.boards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.boards_id_seq OWNER TO j;

--
-- Name: boards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.boards_id_seq OWNED BY public.boards.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    content text NOT NULL,
    author text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.comments OWNER TO j;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO j;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: consultations; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.consultations (
    id integer NOT NULL,
    data text DEFAULT '{}'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_memo text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.consultations OWNER TO j;

--
-- Name: consultations_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.consultations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consultations_id_seq OWNER TO j;

--
-- Name: consultations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.consultations_id_seq OWNED BY public.consultations.id;


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.faqs (
    id integer NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    category text DEFAULT '일반'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.faqs OWNER TO j;

--
-- Name: faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faqs_id_seq OWNER TO j;

--
-- Name: faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.faqs_id_seq OWNED BY public.faqs.id;


--
-- Name: form_configs; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.form_configs (
    id integer NOT NULL,
    form_type text NOT NULL,
    fields text DEFAULT '[]'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.form_configs OWNER TO j;

--
-- Name: form_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.form_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.form_configs_id_seq OWNER TO j;

--
-- Name: form_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.form_configs_id_seq OWNED BY public.form_configs.id;


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.inquiries (
    id integer NOT NULL,
    name text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_memo text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.inquiries OWNER TO j;

--
-- Name: inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inquiries_id_seq OWNER TO j;

--
-- Name: inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.inquiries_id_seq OWNED BY public.inquiries.id;


--
-- Name: member_fields; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.member_fields (
    id integer NOT NULL,
    field_key text NOT NULL,
    label text NOT NULL,
    field_type text DEFAULT 'text'::text NOT NULL,
    required boolean DEFAULT false NOT NULL,
    options text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.member_fields OWNER TO j;

--
-- Name: member_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.member_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.member_fields_id_seq OWNER TO j;

--
-- Name: member_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.member_fields_id_seq OWNED BY public.member_fields.id;


--
-- Name: members; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.members (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    extra_data text DEFAULT '{}'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.members OWNER TO j;

--
-- Name: members_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.members_id_seq OWNER TO j;

--
-- Name: members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.members_id_seq OWNED BY public.members.id;


--
-- Name: page_sections; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.page_sections (
    id integer NOT NULL,
    page_id integer NOT NULL,
    template_id integer NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_fixed boolean DEFAULT false NOT NULL,
    fix_position text,
    html_content text DEFAULT ''::text NOT NULL,
    css_content text DEFAULT ''::text NOT NULL,
    js_content text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.page_sections OWNER TO j;

--
-- Name: page_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.page_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.page_sections_id_seq OWNER TO j;

--
-- Name: page_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.page_sections_id_seq OWNED BY public.page_sections.id;


--
-- Name: pages; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.pages (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    page_type text DEFAULT 'main'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pages OWNER TO j;

--
-- Name: pages_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.pages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pages_id_seq OWNER TO j;

--
-- Name: pages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.pages_id_seq OWNED BY public.pages.id;


--
-- Name: popups; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.popups (
    id integer NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    popup_type text DEFAULT 'image'::text NOT NULL,
    image_url text,
    html_content text DEFAULT ''::text NOT NULL,
    link_url text,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp(3) without time zone,
    end_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.popups OWNER TO j;

--
-- Name: popups_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.popups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.popups_id_seq OWNER TO j;

--
-- Name: popups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.popups_id_seq OWNED BY public.popups.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    board_id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    author text NOT NULL,
    password text,
    is_secret boolean DEFAULT false NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    image_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.posts OWNER TO j;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO j;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.reservations (
    id integer NOT NULL,
    data text DEFAULT '{}'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_memo text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reservations OWNER TO j;

--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.reservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_id_seq OWNER TO j;

--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO j;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO j;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: template_folders; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.template_folders (
    id integer NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    color text DEFAULT '#3182F6'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.template_folders OWNER TO j;

--
-- Name: template_folders_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.template_folders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.template_folders_id_seq OWNER TO j;

--
-- Name: template_folders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.template_folders_id_seq OWNED BY public.template_folders.id;


--
-- Name: template_versions; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.template_versions (
    id integer NOT NULL,
    template_id integer NOT NULL,
    version integer NOT NULL,
    html_content text NOT NULL,
    css_content text DEFAULT ''::text NOT NULL,
    js_content text DEFAULT ''::text NOT NULL,
    memo text DEFAULT ''::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.template_versions OWNER TO j;

--
-- Name: template_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.template_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.template_versions_id_seq OWNER TO j;

--
-- Name: template_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.template_versions_id_seq OWNED BY public.template_versions.id;


--
-- Name: templates; Type: TABLE; Schema: public; Owner: j
--

CREATE TABLE public.templates (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    html_content text NOT NULL,
    css_content text DEFAULT ''::text NOT NULL,
    js_content text DEFAULT ''::text NOT NULL,
    thumbnail text,
    is_original boolean DEFAULT true NOT NULL,
    source_id integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    folder_id integer
);


ALTER TABLE public.templates OWNER TO j;

--
-- Name: templates_id_seq; Type: SEQUENCE; Schema: public; Owner: j
--

CREATE SEQUENCE public.templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.templates_id_seq OWNER TO j;

--
-- Name: templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: j
--

ALTER SEQUENCE public.templates_id_seq OWNED BY public.templates.id;


--
-- Name: admin_logs id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.admin_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_logs_id_seq'::regclass);


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: banners id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.banners ALTER COLUMN id SET DEFAULT nextval('public.banners_id_seq'::regclass);


--
-- Name: boards id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.boards ALTER COLUMN id SET DEFAULT nextval('public.boards_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: consultations id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.consultations ALTER COLUMN id SET DEFAULT nextval('public.consultations_id_seq'::regclass);


--
-- Name: faqs id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.faqs ALTER COLUMN id SET DEFAULT nextval('public.faqs_id_seq'::regclass);


--
-- Name: form_configs id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.form_configs ALTER COLUMN id SET DEFAULT nextval('public.form_configs_id_seq'::regclass);


--
-- Name: inquiries id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN id SET DEFAULT nextval('public.inquiries_id_seq'::regclass);


--
-- Name: member_fields id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.member_fields ALTER COLUMN id SET DEFAULT nextval('public.member_fields_id_seq'::regclass);


--
-- Name: members id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.members ALTER COLUMN id SET DEFAULT nextval('public.members_id_seq'::regclass);


--
-- Name: page_sections id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.page_sections ALTER COLUMN id SET DEFAULT nextval('public.page_sections_id_seq'::regclass);


--
-- Name: pages id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.pages ALTER COLUMN id SET DEFAULT nextval('public.pages_id_seq'::regclass);


--
-- Name: popups id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.popups ALTER COLUMN id SET DEFAULT nextval('public.popups_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: template_folders id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.template_folders ALTER COLUMN id SET DEFAULT nextval('public.template_folders_id_seq'::regclass);


--
-- Name: template_versions id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.template_versions ALTER COLUMN id SET DEFAULT nextval('public.template_versions_id_seq'::regclass);


--
-- Name: templates id; Type: DEFAULT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.templates ALTER COLUMN id SET DEFAULT nextval('public.templates_id_seq'::regclass);


--
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: boards boards_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: consultations consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: form_configs form_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.form_configs
    ADD CONSTRAINT form_configs_pkey PRIMARY KEY (id);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: member_fields member_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.member_fields
    ADD CONSTRAINT member_fields_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: page_sections page_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.page_sections
    ADD CONSTRAINT page_sections_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: popups popups_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.popups
    ADD CONSTRAINT popups_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: template_folders template_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.template_folders
    ADD CONSTRAINT template_folders_pkey PRIMARY KEY (id);


--
-- Name: template_versions template_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.template_versions
    ADD CONSTRAINT template_versions_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: admins_login_id_key; Type: INDEX; Schema: public; Owner: j
--

CREATE UNIQUE INDEX admins_login_id_key ON public.admins USING btree (login_id);


--
-- Name: boards_board_id_key; Type: INDEX; Schema: public; Owner: j
--

CREATE UNIQUE INDEX boards_board_id_key ON public.boards USING btree (board_id);


--
-- Name: form_configs_form_type_key; Type: INDEX; Schema: public; Owner: j
--

CREATE UNIQUE INDEX form_configs_form_type_key ON public.form_configs USING btree (form_type);


--
-- Name: member_fields_field_key_key; Type: INDEX; Schema: public; Owner: j
--

CREATE UNIQUE INDEX member_fields_field_key_key ON public.member_fields USING btree (field_key);


--
-- Name: members_email_key; Type: INDEX; Schema: public; Owner: j
--

CREATE UNIQUE INDEX members_email_key ON public.members USING btree (email);


--
-- Name: pages_slug_key; Type: INDEX; Schema: public; Owner: j
--

CREATE UNIQUE INDEX pages_slug_key ON public.pages USING btree (slug);


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: j
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: template_versions_template_id_version_key; Type: INDEX; Schema: public; Owner: j
--

CREATE UNIQUE INDEX template_versions_template_id_version_key ON public.template_versions USING btree (template_id, version);


--
-- Name: templates_slug_key; Type: INDEX; Schema: public; Owner: j
--

CREATE UNIQUE INDEX templates_slug_key ON public.templates USING btree (slug);


--
-- Name: admin_logs admin_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: banners banners_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: page_sections page_sections_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.page_sections
    ADD CONSTRAINT page_sections_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: page_sections page_sections_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.page_sections
    ADD CONSTRAINT page_sections_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: posts posts_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: template_versions template_versions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.template_versions
    ADD CONSTRAINT template_versions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: templates templates_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.template_folders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: templates templates_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: j
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict gPzG0du3auwCo4lGiEfHuGKolACgShqLPRCa2xXjgfhtGnGAPvmccUAjfZj31hV

