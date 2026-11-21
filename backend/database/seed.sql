--
-- PostgreSQL database dump
--

\restrict oQDXVhzIjn8l40pasEgNNAwRABLUsB6QbmrLh2s6qYcTHpWvKyeKHAgGuJP2L2a

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-11-21 16:09:54

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

--
-- TOC entry 904 (class 1247 OID 24776)
-- Name: enum_absence_absence_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_absence_absence_type AS ENUM (
    'Болезнь',
    'Уважительная причина',
    'Неуважительная причина',
    'Опоздание'
);


--
-- TOC entry 898 (class 1247 OID 24735)
-- Name: enum_grade_grade_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_grade_grade_type AS ENUM (
    'Ответ на уроке',
    'Домашнее задание',
    'Контрольная работа',
    'Проект'
);


--
-- TOC entry 871 (class 1247 OID 24578)
-- Name: enum_user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_user_role AS ENUM (
    'Учитель',
    'Ученик',
    'Родитель'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 238 (class 1259 OID 24786)
-- Name: absence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.absence (
    id integer NOT NULL,
    student_id integer NOT NULL,
    assignment_id integer NOT NULL,
    lesson_date date NOT NULL,
    absence_type public.enum_absence_absence_type DEFAULT 'Неуважительная причина'::public.enum_absence_absence_type NOT NULL,
    reason character varying(255),
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 24785)
-- Name: absence_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.absence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 237
-- Name: absence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.absence_id_seq OWNED BY public.absence.id;


--
-- TOC entry 236 (class 1259 OID 24744)
-- Name: grade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grade (
    id integer NOT NULL,
    student_id integer NOT NULL,
    assignment_id integer NOT NULL,
    value smallint NOT NULL,
    lesson_date date NOT NULL,
    grade_type public.enum_grade_grade_type DEFAULT 'Ответ на уроке'::public.enum_grade_grade_type NOT NULL,
    weight smallint DEFAULT 1 NOT NULL,
    comment character varying(255),
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT grade_value_range CHECK (((value >= 1) AND (value <= 5))),
    CONSTRAINT grade_weight_positive CHECK ((weight > 0))
);


--
-- TOC entry 235 (class 1259 OID 24743)
-- Name: grade_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grade_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 235
-- Name: grade_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grade_id_seq OWNED BY public.grade.id;


--
-- TOC entry 228 (class 1259 OID 24658)
-- Name: parent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parent (
    id integer NOT NULL,
    user_id integer NOT NULL,
    phone character varying(20),
    email character varying(100)
);


--
-- TOC entry 227 (class 1259 OID 24657)
-- Name: parent_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 227
-- Name: parent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parent_id_seq OWNED BY public.parent.id;


--
-- TOC entry 230 (class 1259 OID 24674)
-- Name: parent_student; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parent_student (
    id integer NOT NULL,
    parent_id integer NOT NULL,
    student_id integer NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 24673)
-- Name: parent_student_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parent_student_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 229
-- Name: parent_student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parent_student_id_seq OWNED BY public.parent_student.id;


--
-- TOC entry 224 (class 1259 OID 24620)
-- Name: school_class; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.school_class (
    id integer NOT NULL,
    name character varying(10) NOT NULL,
    academic_year smallint NOT NULL,
    homeroom_teacher_id integer,
    started_at date
);


--
-- TOC entry 223 (class 1259 OID 24619)
-- Name: school_class_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.school_class_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 223
-- Name: school_class_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.school_class_id_seq OWNED BY public.school_class.id;


--
-- TOC entry 226 (class 1259 OID 24636)
-- Name: student; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student (
    id integer NOT NULL,
    user_id integer NOT NULL,
    class_id integer NOT NULL,
    birth_date date,
    enrolled_at date
);


--
-- TOC entry 225 (class 1259 OID 24635)
-- Name: student_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 225
-- Name: student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_id_seq OWNED BY public.student.id;


--
-- TOC entry 232 (class 1259 OID 24695)
-- Name: subject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subject (
    id integer NOT NULL,
    name character varying(60) NOT NULL,
    description text
);


--
-- TOC entry 231 (class 1259 OID 24694)
-- Name: subject_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subject_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 231
-- Name: subject_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subject_id_seq OWNED BY public.subject.id;


--
-- TOC entry 222 (class 1259 OID 24604)
-- Name: teacher; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher (
    id integer NOT NULL,
    user_id integer NOT NULL,
    phone character varying(20),
    email character varying(100)
);


--
-- TOC entry 221 (class 1259 OID 24603)
-- Name: teacher_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teacher_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 221
-- Name: teacher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teacher_id_seq OWNED BY public.teacher.id;


--
-- TOC entry 234 (class 1259 OID 24708)
-- Name: teacher_subject_class; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_subject_class (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    subject_id integer NOT NULL,
    class_id integer NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 24707)
-- Name: teacher_subject_class_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teacher_subject_class_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 233
-- Name: teacher_subject_class_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teacher_subject_class_id_seq OWNED BY public.teacher_subject_class.id;


--
-- TOC entry 220 (class 1259 OID 24586)
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(150) NOT NULL,
    role public.enum_user_role NOT NULL,
    lastname character varying(30) NOT NULL,
    firstname character varying(30) NOT NULL,
    middlename character varying(30),
    url_avatar character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 24585)
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 219
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- TOC entry 4923 (class 2604 OID 24789)
-- Name: absence id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence ALTER COLUMN id SET DEFAULT nextval('public.absence_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 24747)
-- Name: grade id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade ALTER COLUMN id SET DEFAULT nextval('public.grade_id_seq'::regclass);


--
-- TOC entry 4915 (class 2604 OID 24661)
-- Name: parent id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent ALTER COLUMN id SET DEFAULT nextval('public.parent_id_seq'::regclass);


--
-- TOC entry 4916 (class 2604 OID 24677)
-- Name: parent_student id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_student ALTER COLUMN id SET DEFAULT nextval('public.parent_student_id_seq'::regclass);


--
-- TOC entry 4913 (class 2604 OID 24623)
-- Name: school_class id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_class ALTER COLUMN id SET DEFAULT nextval('public.school_class_id_seq'::regclass);


--
-- TOC entry 4914 (class 2604 OID 24639)
-- Name: student id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student ALTER COLUMN id SET DEFAULT nextval('public.student_id_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 24698)
-- Name: subject id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject ALTER COLUMN id SET DEFAULT nextval('public.subject_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 24607)
-- Name: teacher id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher ALTER COLUMN id SET DEFAULT nextval('public.teacher_id_seq'::regclass);


--
-- TOC entry 4918 (class 2604 OID 24711)
-- Name: teacher_subject_class id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_subject_class ALTER COLUMN id SET DEFAULT nextval('public.teacher_subject_class_id_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 24589)
-- Name: user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- TOC entry 5145 (class 0 OID 24786)
-- Dependencies: 238
-- Data for Name: absence; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.absence VALUES (1, 1, 1, '2026-11-10', 'Болезнь', 'Справка от врача', 1, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.absence VALUES (2, 2, 2, '2026-11-11', 'Опоздание', 'Опоздал на 10 минут', 2, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.absence VALUES (3, 3, 4, '2026-11-12', 'Уважительная причина', 'Соревнования', 2, '2026-11-21 16:00:49.892685+08');


--
-- TOC entry 5143 (class 0 OID 24744)
-- Dependencies: 236
-- Data for Name: grade; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.grade VALUES (1, 1, 1, 5, '2026-11-09', 'Ответ на уроке', 1, NULL, 1, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.grade VALUES (2, 1, 1, 4, '2026-11-10', 'Домашнее задание', 1, NULL, 1, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.grade VALUES (3, 1, 1, 3, '2026-11-11', 'Контрольная работа', 2, 'Ошибки в дробях', 1, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.grade VALUES (4, 1, 2, 4, '2026-11-09', 'Ответ на уроке', 1, NULL, 2, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.grade VALUES (5, 1, 2, 5, '2026-11-12', 'Контрольная работа', 2, 'Отлично', 2, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.grade VALUES (6, 1, 3, 5, '2026-11-10', 'Ответ на уроке', 1, NULL, 1, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.grade VALUES (7, 2, 1, 2, '2026-11-09', 'Ответ на уроке', 1, NULL, 1, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.grade VALUES (8, 2, 1, 4, '2026-11-11', 'Контрольная работа', 2, 'Исправилась', 1, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.grade VALUES (9, 2, 2, 3, '2026-11-10', 'Домашнее задание', 1, NULL, 2, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.grade VALUES (10, 3, 4, 5, '2026-11-09', 'Домашнее задание', 1, NULL, 2, '2026-11-21 16:00:49.892685+08');
INSERT INTO public.grade VALUES (11, 3, 5, 4, '2026-11-10', 'Ответ на уроке', 1, NULL, 1, '2026-11-21 16:00:49.892685+08');


--
-- TOC entry 5135 (class 0 OID 24658)
-- Dependencies: 228
-- Data for Name: parent; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.parent VALUES (1, 6, '+7-900-333-33-33', 'petrov@mail.ru');
INSERT INTO public.parent VALUES (2, 7, '+7-900-444-44-44', 'sidorova@mail.ru');
INSERT INTO public.parent VALUES (3, 8, '+7-900-000-00-00', NULL);


--
-- TOC entry 5137 (class 0 OID 24674)
-- Dependencies: 230
-- Data for Name: parent_student; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.parent_student VALUES (1, 1, 1);
INSERT INTO public.parent_student VALUES (2, 1, 2);
INSERT INTO public.parent_student VALUES (3, 2, 3);


--
-- TOC entry 5131 (class 0 OID 24620)
-- Dependencies: 224
-- Data for Name: school_class; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.school_class VALUES (1, '5А', 2026, 1, '2026-09-01');
INSERT INTO public.school_class VALUES (2, '6Б', 2026, 2, '2026-09-01');
INSERT INTO public.school_class VALUES (3, '5А', 2025, 1, '2025-09-01');


--
-- TOC entry 5133 (class 0 OID 24636)
-- Dependencies: 226
-- Data for Name: student; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.student VALUES (2, 4, 1, '2014-07-25', '2026-09-01');
INSERT INTO public.student VALUES (3, 5, 2, '2013-11-02', '2026-09-01');
INSERT INTO public.student VALUES (4, 9, 2, NULL, NULL);
INSERT INTO public.student VALUES (1, 3, 1, '2014-03-12', '2026-09-01');


--
-- TOC entry 5139 (class 0 OID 24695)
-- Dependencies: 232
-- Data for Name: subject; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.subject VALUES (1, 'Математика', 'Алгебра и геометрия');
INSERT INTO public.subject VALUES (2, 'Русский язык', 'Грамматика и орфография');
INSERT INTO public.subject VALUES (3, 'Литература', 'Чтение и анализ произведений');
INSERT INTO public.subject VALUES (4, 'История', 'История России');
INSERT INTO public.subject VALUES (5, 'Биология', 'Основы биологии');
INSERT INTO public.subject VALUES (6, 'Физика', 'Механика, оптика, электричество');


--
-- TOC entry 5129 (class 0 OID 24604)
-- Dependencies: 222
-- Data for Name: teacher; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.teacher VALUES (1, 1, '+7-900-111-11-11', 'ivanov@school.ru');
INSERT INTO public.teacher VALUES (2, 2, '+7-900-222-22-22', 'smirnova@school.ru');


--
-- TOC entry 5141 (class 0 OID 24708)
-- Dependencies: 234
-- Data for Name: teacher_subject_class; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.teacher_subject_class VALUES (1, 1, 1, 1);
INSERT INTO public.teacher_subject_class VALUES (2, 2, 2, 1);
INSERT INTO public.teacher_subject_class VALUES (3, 1, 4, 1);
INSERT INTO public.teacher_subject_class VALUES (4, 2, 2, 2);
INSERT INTO public.teacher_subject_class VALUES (5, 1, 1, 2);


--
-- TOC entry 5127 (class 0 OID 24586)
-- Dependencies: 220
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."user" VALUES (1, 'teacher1', '$2b$10$LjjBPAmixGhxbHXyX4G74u9TleY7Tv5IrHBA2EBHIvQcoCjRq7ekC', 'Учитель', 'Иванов', 'Пётр', 'Сергеевич', NULL, '2026-11-21 16:00:49.892685+08');
INSERT INTO public."user" VALUES (2, 'teacher2', '$2b$10$LjjBPAmixGhxbHXyX4G74u9TleY7Tv5IrHBA2EBHIvQcoCjRq7ekC', 'Учитель', 'Смирнова', 'Ольга', 'Викторовна', NULL, '2026-11-21 16:00:49.892685+08');
INSERT INTO public."user" VALUES (3, 'student1', '$2b$10$LjjBPAmixGhxbHXyX4G74u9TleY7Tv5IrHBA2EBHIvQcoCjRq7ekC', 'Ученик', 'Петров', 'Алексей', 'Игоревич', NULL, '2026-11-21 16:00:49.892685+08');
INSERT INTO public."user" VALUES (4, 'student2', '$2b$10$LjjBPAmixGhxbHXyX4G74u9TleY7Tv5IrHBA2EBHIvQcoCjRq7ekC', 'Ученик', 'Петрова', 'Мария', 'Игоревна', NULL, '2026-11-21 16:00:49.892685+08');
INSERT INTO public."user" VALUES (5, 'student3', '$2b$10$LjjBPAmixGhxbHXyX4G74u9TleY7Tv5IrHBA2EBHIvQcoCjRq7ekC', 'Ученик', 'Сидоров', 'Илья', 'Андреевич', NULL, '2026-11-21 16:00:49.892685+08');
INSERT INTO public."user" VALUES (6, 'parent1', '$2b$10$LjjBPAmixGhxbHXyX4G74u9TleY7Tv5IrHBA2EBHIvQcoCjRq7ekC', 'Родитель', 'Петров', 'Сергей', 'Игоревич', NULL, '2026-11-21 16:00:49.892685+08');
INSERT INTO public."user" VALUES (7, 'parent2', '$2b$10$LjjBPAmixGhxbHXyX4G74u9TleY7Tv5IrHBA2EBHIvQcoCjRq7ekC', 'Родитель', 'Сидорова', 'Елена', 'Викторовна', NULL, '2026-11-21 16:00:49.892685+08');
INSERT INTO public."user" VALUES (8, 'parent_test', '$2b$10$I9vXuP2yC8NanwMubuX.bO5/6J7UqBzylZEGWb8sFPQYAFV1nwyHa', 'Родитель', 'Тестовая', 'Мама', NULL, NULL, '2026-11-21 16:01:18.989+08');
INSERT INTO public."user" VALUES (9, 'student_test', '$2b$10$StXfPvN/TQLcVm.EHbzW3O0mbMnTTDiEjyrwxuB/.wDavbUSS7djy', 'Ученик', 'Тестовый', 'Ученик', NULL, NULL, '2026-11-21 16:01:19.262+08');


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 237
-- Name: absence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.absence_id_seq', 5, true);


--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 235
-- Name: grade_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.grade_id_seq', 12, true);


--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 227
-- Name: parent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parent_id_seq', 3, true);


--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 229
-- Name: parent_student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parent_student_id_seq', 5, true);


--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 223
-- Name: school_class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.school_class_id_seq', 4, true);


--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 225
-- Name: student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_id_seq', 4, true);


--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 231
-- Name: subject_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subject_id_seq', 8, true);


--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 221
-- Name: teacher_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teacher_id_seq', 2, true);


--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 233
-- Name: teacher_subject_class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teacher_subject_class_id_seq', 7, true);


--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 219
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_id_seq', 10, true);


--
-- TOC entry 4960 (class 2606 OID 24798)
-- Name: absence absence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence
    ADD CONSTRAINT absence_pkey PRIMARY KEY (id);


--
-- TOC entry 4958 (class 2606 OID 24759)
-- Name: grade grade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade
    ADD CONSTRAINT grade_pkey PRIMARY KEY (id);


--
-- TOC entry 4944 (class 2606 OID 24665)
-- Name: parent parent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent
    ADD CONSTRAINT parent_pkey PRIMARY KEY (id);


--
-- TOC entry 4949 (class 2606 OID 24682)
-- Name: parent_student parent_student_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_student
    ADD CONSTRAINT parent_student_pkey PRIMARY KEY (id);


--
-- TOC entry 4946 (class 2606 OID 24667)
-- Name: parent parent_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent
    ADD CONSTRAINT parent_user_id_key UNIQUE (user_id);


--
-- TOC entry 4938 (class 2606 OID 24628)
-- Name: school_class school_class_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_class
    ADD CONSTRAINT school_class_pkey PRIMARY KEY (id);


--
-- TOC entry 4940 (class 2606 OID 24644)
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_pkey PRIMARY KEY (id);


--
-- TOC entry 4942 (class 2606 OID 24646)
-- Name: student student_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_user_id_key UNIQUE (user_id);


--
-- TOC entry 4951 (class 2606 OID 24706)
-- Name: subject subject_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject
    ADD CONSTRAINT subject_name_key UNIQUE (name);


--
-- TOC entry 4953 (class 2606 OID 24704)
-- Name: subject subject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject
    ADD CONSTRAINT subject_pkey PRIMARY KEY (id);


--
-- TOC entry 4933 (class 2606 OID 24611)
-- Name: teacher teacher_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher
    ADD CONSTRAINT teacher_pkey PRIMARY KEY (id);


--
-- TOC entry 4955 (class 2606 OID 24717)
-- Name: teacher_subject_class teacher_subject_class_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_subject_class
    ADD CONSTRAINT teacher_subject_class_pkey PRIMARY KEY (id);


--
-- TOC entry 4935 (class 2606 OID 24613)
-- Name: teacher teacher_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher
    ADD CONSTRAINT teacher_user_id_key UNIQUE (user_id);


--
-- TOC entry 4929 (class 2606 OID 24600)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 4931 (class 2606 OID 24602)
-- Name: user user_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_username_key UNIQUE (username);


--
-- TOC entry 4961 (class 1259 OID 24996)
-- Name: absence_student_assignment_date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX absence_student_assignment_date ON public.absence USING btree (student_id, assignment_id, lesson_date);


--
-- TOC entry 4962 (class 1259 OID 24997)
-- Name: absence_student_id_assignment_id_lesson_date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX absence_student_id_assignment_id_lesson_date ON public.absence USING btree (student_id, assignment_id, lesson_date);


--
-- TOC entry 4947 (class 1259 OID 24693)
-- Name: parent_student_parent_id_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX parent_student_parent_id_student_id ON public.parent_student USING btree (parent_id, student_id);


--
-- TOC entry 4936 (class 1259 OID 24634)
-- Name: school_class_name_academic_year; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX school_class_name_academic_year ON public.school_class USING btree (name, academic_year);


--
-- TOC entry 4956 (class 1259 OID 24733)
-- Name: teacher_subject_class_teacher_id_subject_id_class_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX teacher_subject_class_teacher_id_subject_id_class_id ON public.teacher_subject_class USING btree (teacher_id, subject_id, class_id);


--
-- TOC entry 4976 (class 2606 OID 24804)
-- Name: absence absence_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence
    ADD CONSTRAINT absence_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.teacher_subject_class(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4977 (class 2606 OID 24809)
-- Name: absence absence_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence
    ADD CONSTRAINT absence_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.teacher(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4978 (class 2606 OID 24799)
-- Name: absence absence_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence
    ADD CONSTRAINT absence_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4973 (class 2606 OID 24765)
-- Name: grade grade_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade
    ADD CONSTRAINT grade_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.teacher_subject_class(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4974 (class 2606 OID 24770)
-- Name: grade grade_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade
    ADD CONSTRAINT grade_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.teacher(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4975 (class 2606 OID 24760)
-- Name: grade grade_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade
    ADD CONSTRAINT grade_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4968 (class 2606 OID 24683)
-- Name: parent_student parent_student_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_student
    ADD CONSTRAINT parent_student_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parent(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4969 (class 2606 OID 24688)
-- Name: parent_student parent_student_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_student
    ADD CONSTRAINT parent_student_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4967 (class 2606 OID 24668)
-- Name: parent parent_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent
    ADD CONSTRAINT parent_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4964 (class 2606 OID 24629)
-- Name: school_class school_class_homeroom_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_class
    ADD CONSTRAINT school_class_homeroom_teacher_id_fkey FOREIGN KEY (homeroom_teacher_id) REFERENCES public.teacher(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4965 (class 2606 OID 24652)
-- Name: student student_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.school_class(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4966 (class 2606 OID 24647)
-- Name: student student_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4970 (class 2606 OID 24728)
-- Name: teacher_subject_class teacher_subject_class_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_subject_class
    ADD CONSTRAINT teacher_subject_class_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.school_class(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4971 (class 2606 OID 24723)
-- Name: teacher_subject_class teacher_subject_class_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_subject_class
    ADD CONSTRAINT teacher_subject_class_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4972 (class 2606 OID 24718)
-- Name: teacher_subject_class teacher_subject_class_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_subject_class
    ADD CONSTRAINT teacher_subject_class_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teacher(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4963 (class 2606 OID 24614)
-- Name: teacher teacher_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher
    ADD CONSTRAINT teacher_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2026-11-21 16:09:54

--
-- PostgreSQL database dump complete
--

\unrestrict oQDXVhzIjn8l40pasEgNNAwRABLUsB6QbmrLh2s6qYcTHpWvKyeKHAgGuJP2L2a

