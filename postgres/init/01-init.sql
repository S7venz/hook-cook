-- Hook & Cook seed dump
-- Régénéré automatiquement par scripts/dump.sh
-- 2026-04-21T10:04:17Z

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

ALTER TABLE IF EXISTS ONLY public.contest_registrations DROP CONSTRAINT IF EXISTS fkhdpd7utl67hsa3w4piistvrjc;
ALTER TABLE IF EXISTS ONLY public.permits DROP CONSTRAINT IF EXISTS fkdlirpgjsjlre4xl06v1e4wpf1;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS fkbioxgbv59vetrxe0ejfubep1w;
ALTER TABLE IF EXISTS ONLY public.catch_entries DROP CONSTRAINT IF EXISTS fk7crnpgry48hhldhvbn4vtxm7e;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS fk32ql8ubntj5uh44ph9659tiih;
ALTER TABLE IF EXISTS ONLY public.contest_registrations DROP CONSTRAINT IF EXISTS fk1s8sjd7jay95uhocir4q6ueu1;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public.permits_user_idx;
DROP INDEX IF EXISTS public.permits_reference_idx;
DROP INDEX IF EXISTS public.orders_user_idx;
DROP INDEX IF EXISTS public.orders_reference_idx;
DROP INDEX IF EXISTS public.contest_reg_user_idx;
DROP INDEX IF EXISTS public.contest_reg_contest_idx;
DROP INDEX IF EXISTS public.catch_entries_user_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS uk_msasak5ul79vpg5fimli8jwrd;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS uk_6dotkott2kjsp8vw4d0m25fb7;
ALTER TABLE IF EXISTS ONLY public.permits DROP CONSTRAINT IF EXISTS uk_2grmjm612hum35j6jt7n4418a;
ALTER TABLE IF EXISTS ONLY public.techniques DROP CONSTRAINT IF EXISTS techniques_pkey;
ALTER TABLE IF EXISTS ONLY public.species DROP CONSTRAINT IF EXISTS species_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.permits DROP CONSTRAINT IF EXISTS permits_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.contests DROP CONSTRAINT IF EXISTS contests_pkey;
ALTER TABLE IF EXISTS ONLY public.contest_registrations DROP CONSTRAINT IF EXISTS contest_registrations_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.catch_entries DROP CONSTRAINT IF EXISTS catch_entries_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.techniques;
DROP TABLE IF EXISTS public.species;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.permits;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.order_items;
DROP SEQUENCE IF EXISTS public.hibernate_sequence;
DROP TABLE IF EXISTS public.contests;
DROP TABLE IF EXISTS public.contest_registrations;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.catch_entries;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: catch_entries; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.catch_entries (
    id bigint NOT NULL,
    version bigint NOT NULL,
    weather character varying(120),
    date_created timestamp without time zone NOT NULL,
    last_updated timestamp without time zone NOT NULL,
    catch_date character varying(20) NOT NULL,
    species character varying(40) NOT NULL,
    bait character varying(255),
    user_id bigint NOT NULL,
    poids integer,
    spot character varying(255),
    photo_label character varying(255),
    taille integer NOT NULL
);


ALTER TABLE public.catch_entries OWNER TO hookcook;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.categories (
    id character varying(40) NOT NULL,
    version bigint NOT NULL,
    name character varying(80) NOT NULL,
    display_count integer NOT NULL
);


ALTER TABLE public.categories OWNER TO hookcook;

--
-- Name: contest_registrations; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.contest_registrations (
    id bigint NOT NULL,
    version bigint NOT NULL,
    permit_number character varying(40),
    date_created timestamp without time zone NOT NULL,
    last_updated timestamp without time zone NOT NULL,
    user_id bigint NOT NULL,
    category character varying(40) NOT NULL,
    contest_id character varying(80) NOT NULL
);


ALTER TABLE public.contest_registrations OWNER TO hookcook;

--
-- Name: contests; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.contests (
    id character varying(80) NOT NULL,
    version bigint NOT NULL,
    date character varying(20) NOT NULL,
    date_created timestamp without time zone NOT NULL,
    price numeric(19,2) NOT NULL,
    last_updated timestamp without time zone NOT NULL,
    date_display character varying(20) NOT NULL,
    species_csv character varying(255),
    format character varying(120),
    inscrits integer NOT NULL,
    title character varying(200) NOT NULL,
    reglement text,
    max integer NOT NULL,
    distance character varying(20),
    lieu character varying(200) NOT NULL
);


ALTER TABLE public.contests OWNER TO hookcook;

--
-- Name: hibernate_sequence; Type: SEQUENCE; Schema: public; Owner: hookcook
--

CREATE SEQUENCE public.hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hibernate_sequence OWNER TO hookcook;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.order_items (
    id bigint NOT NULL,
    version bigint NOT NULL,
    unit_price numeric(19,2) NOT NULL,
    product_name character varying(200) NOT NULL,
    qty integer NOT NULL,
    product_image_url character varying(500),
    product_brand character varying(120),
    product_sku character varying(60),
    product_id character varying(80) NOT NULL,
    order_id bigint NOT NULL
);


ALTER TABLE public.order_items OWNER TO hookcook;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    version bigint NOT NULL,
    date_created timestamp without time zone NOT NULL,
    status_label character varying(40) NOT NULL,
    shipping_mode character varying(80) NOT NULL,
    postal_code character varying(20) NOT NULL,
    total numeric(19,2) NOT NULL,
    address_line character varying(255) NOT NULL,
    last_updated timestamp without time zone NOT NULL,
    shipping numeric(19,2) NOT NULL,
    city character varying(120) NOT NULL,
    user_id bigint NOT NULL,
    subtotal numeric(19,2) NOT NULL,
    status character varying(9) NOT NULL,
    email character varying(320) NOT NULL,
    reference character varying(40) NOT NULL
);


ALTER TABLE public.orders OWNER TO hookcook;

--
-- Name: permits; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.permits (
    id bigint NOT NULL,
    version bigint NOT NULL,
    history_json text,
    date_created timestamp without time zone NOT NULL,
    status_label character varying(40) NOT NULL,
    first_name character varying(120) NOT NULL,
    last_updated timestamp without time zone NOT NULL,
    department character varying(80) NOT NULL,
    type_id character varying(40) NOT NULL,
    user_id bigint NOT NULL,
    type_title character varying(80) NOT NULL,
    status character varying(8) NOT NULL,
    birth_date character varying(20) NOT NULL,
    last_name character varying(120) NOT NULL,
    amount numeric(19,2) NOT NULL,
    reference character varying(40) NOT NULL
);


ALTER TABLE public.permits OWNER TO hookcook;

--
-- Name: products; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.products (
    id character varying(80) NOT NULL,
    version bigint NOT NULL,
    story text,
    reviews integer,
    date_created timestamp without time zone NOT NULL,
    months_csv character varying(60),
    price numeric(19,2) NOT NULL,
    last_updated timestamp without time zone NOT NULL,
    variants_json text,
    species_csv character varying(255),
    sku character varying(60) NOT NULL,
    rating numeric(19,2),
    brand character varying(120),
    low_stock_threshold integer,
    img character varying(255),
    name character varying(200) NOT NULL,
    stock integer NOT NULL,
    image_url character varying(500),
    technique character varying(40),
    category character varying(40) NOT NULL,
    specs_json text,
    water character varying(40),
    was_price numeric(19,2),
    description text
);


ALTER TABLE public.products OWNER TO hookcook;

--
-- Name: species; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.species (
    id character varying(40) NOT NULL,
    version bigint NOT NULL,
    months_csv character varying(60),
    name character varying(80) NOT NULL,
    image_url character varying(500),
    latin character varying(120),
    water character varying(40)
);


ALTER TABLE public.species OWNER TO hookcook;

--
-- Name: techniques; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.techniques (
    id character varying(40) NOT NULL,
    version bigint NOT NULL,
    name character varying(80) NOT NULL
);


ALTER TABLE public.techniques OWNER TO hookcook;

--
-- Name: users; Type: TABLE; Schema: public; Owner: hookcook
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    version bigint NOT NULL,
    phone character varying(40),
    date_created timestamp without time zone NOT NULL,
    first_name character varying(120) NOT NULL,
    postal_code character varying(20),
    password_hash character varying(255) NOT NULL,
    address_line character varying(255),
    last_updated timestamp without time zone NOT NULL,
    role character varying(10) NOT NULL,
    city character varying(120),
    last_name character varying(120) NOT NULL,
    country character varying(120),
    email character varying(320) NOT NULL
);


ALTER TABLE public.users OWNER TO hookcook;

--
-- Data for Name: catch_entries; Type: TABLE DATA; Schema: public; Owner: hookcook
--



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: hookcook
--

INSERT INTO public.categories VALUES ('cannes', 0, 'Cannes', 47);
INSERT INTO public.categories VALUES ('moulinets', 0, 'Moulinets', 38);
INSERT INTO public.categories VALUES ('leurres', 0, 'Leurres & appâts', 124);
INSERT INTO public.categories VALUES ('soies-lignes', 0, 'Soies & lignes', 29);
INSERT INTO public.categories VALUES ('vetements', 0, 'Vêtements', 56);
INSERT INTO public.categories VALUES ('accessoires', 0, 'Accessoires', 81);


--
-- Data for Name: contest_registrations; Type: TABLE DATA; Schema: public; Owner: hookcook
--



--
-- Data for Name: contests; Type: TABLE DATA; Schema: public; Owner: hookcook
--

INSERT INTO public.contests VALUES ('vesoul-2026-05', 0, '2026-05-04', '2026-04-21 09:40:59.716', 25.00, '2026-04-21 09:40:59.716', '04 MAI', 'truite', 'No-kill · Équipes de 2', 42, 'Open de Vesoul — Truite fario', 'Le concours se tient sur le lac de Vesoul de 7h à 18h. Équipes de deux pêcheurs, sélection par tirage au sort des postes. Matériel libre — mouche, toc, lancer léger — mais hameçons sans ardillon obligatoires. Tous poissons mesurés et relâchés.', 60, '18 km', 'Lac de Vesoul (70)');
INSERT INTO public.contests VALUES ('saone-2026-06', 0, '2026-06-14', '2026-04-21 09:40:59.72', 45.00, '2026-04-21 09:40:59.72', '14 JUIN', 'carpe', '24h · Individuel', 58, 'Concours carpe 24h — Saône', 'Départ samedi 8h, pesée dimanche 8h. Pontons tirés au sort la veille. Amorçage libre, deux cannes max. Classement au poids total des 3 plus grosses prises.', 60, '62 km', 'Saône — Chalon (71)');
INSERT INTO public.contests VALUES ('doubs-2026-03', 0, '2026-03-14', '2026-04-21 09:40:59.722', 0.00, '2026-04-21 09:40:59.722', '14 MAR', 'truite', 'Classique · Individuel', 89, 'Ouverture Truite — Le Doubs', 'Journée d''ouverture de la truite en première catégorie. Pêche de 6h30 au coucher du soleil. Pesée et remise de prix à 18h à la Maison de la pêche.', 120, '8 km', 'Le Doubs, Montbéliard (25)');
INSERT INTO public.contests VALUES ('etang-carpe-nuit', 0, '2026-07-19', '2026-04-21 09:40:59.725', 30.00, '2026-04-21 09:40:59.725', '19 JUIL', 'carpe,silure', 'Nocturne · Individuel', 18, 'Nocturne Étang de la Forge', 'Nocturne de 20h à 6h. Une canne par pêcheur. Classement combiné poids / nombre.', 40, '35 km', 'Étang de la Forge (25)');


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: hookcook
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: hookcook
--



--
-- Data for Name: permits; Type: TABLE DATA; Schema: public; Owner: hookcook
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: hookcook
--

INSERT INTO public.products VALUES ('hc-bas-ligne', 0, NULL, 68, '2026-04-21 09:40:59.767', '3,4,5,6,7,8,9', 11.50, '2026-04-21 09:40:59.767', '{"diametre":["0.12","0.14","0.16","0.18","0.20"]}', 'truite,ombre', 'HC-0812-BL', 4.50, 'Tournon', 15, 'Bas de ligne fluorocarbone — bobine', 'Bas de ligne fluorocarbone 0.16 mm', 140, 'http://localhost:8080/api/uploads/1776724354923-3f38a54f.avif', 'mouche', 'soies-lignes', NULL, 'rivière', NULL, 'Fluorocarbone japonais haute résistance. Invisible sous l''eau.');
INSERT INTO public.products VALUES ('hc-boite-mouches', 0, NULL, 38, '2026-04-21 09:40:59.762', '3,4,5,6,7,8,9', 32.00, '2026-04-21 09:40:59.762', '{"couleur":["Laiton","Noir mat"]}', 'truite,ombre', 'HC-1108-BM24', 4.40, 'Hook & Cook', 15, 'Boîte à mouches 24 — ouverte', 'Boîte à mouches 24 emplacements', 64, 'http://localhost:8080/api/uploads/1776724394961-66b8b496.avif', 'mouche', 'accessoires', NULL, 'rivière', NULL, 'Boîte alu compartimentée, fermeture magnétique. 24 emplacements mousse anti-rouille.');
INSERT INTO public.products VALUES ('hc-brochet-strike', 0, NULL, 24, '2026-04-21 09:40:59.751', '5,6,7,8,9,10,11,12,1', 259.00, '2026-04-21 09:40:59.751', '{"longueur":["2.10 m","2.40 m","2.70 m"],"puissance":["20-60 g","40-100 g","80-160 g"]}', 'brochet,sandre,silure', 'HC-4401-BR90', 4.70, 'Hook & Cook', 15, 'Canne carnassiers Strike — vue complète', 'Canne carnassiers Strike 2.40 m', 6, 'http://localhost:8080/api/uploads/1776724436718-623ac127.jpg', 'carnassiers', 'cannes', '{"Longueur":"2.40 m","Puissance":"40-100 g","Action":"Rapide","Poids":"184 g","Brins":"2"}', 'lac/rivière', 299.00, 'Blank rigide pour lancer des swimbaits lourds en toute précision. Talon renforcé pour le combat avec les gros poissons.');
INSERT INTO public.products VALUES ('hc-cuissardes', 0, NULL, 41, '2026-04-21 09:40:59.768', '3,4,5,6,7,8,9,10,11', 349.00, '2026-04-21 09:40:59.768', '{"taille":["S","M","L","XL"]}', NULL, 'HC-7711-CU', 4.80, 'Hook & Cook', 15, 'Cuissardes Source — silhouette', 'Cuissardes respirantes Source', 7, 'http://localhost:8080/api/uploads/1776724460596-c6018506.jpg', NULL, 'vetements', NULL, 'rivière', NULL, 'Membrane 4 couches au genou, chaussons néoprène 4 mm, ceinture renforcée.');
INSERT INTO public.products VALUES ('hc-epuisette-pliante', 0, NULL, 23, '2026-04-21 09:40:59.765', '3,4,5,6,7,8,9,10', 78.00, '2026-04-21 09:40:59.765', '{"longueur":["50 cm","60 cm","80 cm"]}', 'truite,ombre,perche', 'HC-6607-EP', 4.90, 'Atelier Peyre', 15, 'Épuisette noyer — repliée', 'Épuisette pliante en noyer 60 cm', 12, 'http://localhost:8080/api/uploads/1776724481709-617dcf4a.jpg', NULL, 'accessoires', NULL, 'rivière', NULL, 'Manche en noyer tourné main, filet caoutchouc sans nœuds. Pliable sur gilet.');
INSERT INTO public.products VALUES ('hc-hamecons-truite', 0, NULL, 89, '2026-04-21 09:40:59.764', '3,4,5,6,7,8,9', 8.90, '2026-04-21 09:40:59.764', '{"taille":["12","14","16","18"]}', 'truite', 'HC-2204-HT14', 4.70, 'Tournon', 15, 'Hameçons truite — boîte ouverte', 'Hameçons truite nº14 (boîte de 50)', 240, 'http://localhost:8080/api/uploads/1776724532397-df8ca485.jpg', 'mouche', 'accessoires', NULL, 'rivière', NULL, 'Hameçons anglais nº14, fil fin, ardillon écrasable. Finition noir mat.');
INSERT INTO public.products VALUES ('hc-leurre-brochet', 0, NULL, 52, '2026-04-21 09:40:59.77', '5,6,7,8,9,10,11,12,1', 38.00, '2026-04-21 09:40:59.77', '{"couleur":["Gardon","Perch","Firetiger","Black"]}', 'brochet,silure', 'HC-3322-SB18', 4.70, 'Hook & Cook', 15, 'Swimbait brochet 18cm', 'Swimbait brochet Wake 18 cm', 36, 'http://localhost:8080/api/uploads/1776724780884-81dbc74c.jpg', 'carnassiers', 'leurres', NULL, 'lac/rivière', NULL, 'Swimbait 3 sections, nage en S. Hameçons triples VMC. Pour prospection lente.');
INSERT INTO public.products VALUES ('hc-leurre-chevesne', 0, NULL, 142, '2026-04-21 09:40:59.754', '3,4,5,6,7,8,9,10,11', 12.50, '2026-04-21 09:40:59.754', '{"couleur":["Naturel","Perch","Motor Oil","Chartreuse"]}', 'perche,sandre', 'HC-3018-CH5', 4.50, 'Hook & Cook', 15, 'Leurres souples — pack ouvert', 'Leurre souple Chevesne 5 cm (pack de 6)', 180, 'http://localhost:8080/api/uploads/1776724808912-25951812.jpg', 'carnassiers', 'leurres', NULL, 'lac/rivière', NULL, 'Imitation de vairon. Queue vibrante, odeur attractant. Idéal en finesse sur perches actives.');
INSERT INTO public.products VALUES ('hc-moulinet-carp', 0, NULL, 56, '2026-04-21 09:40:59.757', '4,5,6,7,8,9,10,11', 179.00, '2026-04-21 09:40:59.757', '{"taille":["6000","8000","10000"]}', 'carpe,silure', 'HC-5511-CA80', 4.60, 'Hook & Cook', 15, 'Moulinet Carp 8000 — profil', 'Moulinet Carpe Long-cast 8000', 9, 'http://localhost:8080/api/uploads/1776724835560-b07fc41b.jpg', 'peche-fond', 'moulinets', '{"Capacit\u00e9":"420 m / 0.35 mm","Ratio":"4.6:1","Roulements":"5 + 1","Poids":"618 g","Frein":"12 kg"}', 'étang/lac', NULL, 'Grande bobine long-cast, 5 roulements étanches. Frein arrière 12 kg, idéal pour la carpe de nuit.');
INSERT INTO public.products VALUES ('hc-sauvage-9-5', 0, 'Fabriquée à Saint-Jean-Pied-de-Port par l''atelier Peyre, cette canne reprend le profil des cannes que Jean-Marc monte depuis trente-deux ans pour les guides du Pays basque. Chaque blank est scellé à la main, les anneaux alignés au fil, le porte-moulinet tourné dans un morceau de noyer local.

Elle est taillée pour la truite farios en eau vive — ce que Jean-Marc appelle "le geste court et la remontée lente". Vous n''achetez pas une canne de série.', 38, '2026-04-21 09:40:59.746', '3,4,5,6,7,8,9', 189.00, '2026-04-21 09:40:59.746', '{"longueur":["8 ft","9 ft","10 ft"],"action":["Moyenne","Moyenne-rapide","Rapide"]}', 'truite,ombre', 'HC-2186-WF5F', 4.60, 'Hook & Cook', 15, 'Canne mouche Sauvage 9ft — vue complète', 'Canne mouche Sauvage 9 ft #5', 14, 'http://localhost:8080/api/uploads/1776724865479-2f51fe83.jpg', 'mouche', 'cannes', '{"Longueur":"9 ft (2.74 m)","Soie":"WF5F","Action":"Moyenne-rapide","Poids":"108 g","Brins":"4","\u00c9tui":"Tube aluminium bross\u00e9","Garantie":"5 ans pi\u00e8ces et main-d''\u0153uvre"}', 'rivière', NULL, 'Soie WF5F adaptée aux petites rivières et ruisseaux de montagne. Blank en carbone à fort module, dessiné pour charger le bas de canne en lancers courts — idéale pour pêcher sous branches.');
INSERT INTO public.products VALUES ('hc-veste-pluie', 0, NULL, 74, '2026-04-21 09:40:59.76', '1,2,3,4,5,6,7,8,9,10,11,12', 289.00, '2026-04-21 09:40:59.76', '{"taille":["S","M","L","XL","XXL"],"couleur":["Algue","Gr\u00e8s","Ardoise"]}', NULL, 'HC-9032-VP', 4.90, 'Hook & Cook', 15, 'Veste Estuaire — silhouette 3/4', 'Veste de pluie Estuaire 3 couches', 22, 'http://localhost:8080/api/uploads/1776724896326-92009896.jpg', NULL, 'vetements', NULL, 'mer/rivière', NULL, 'Membrane 3 couches 20k/20k. Capuche ajustable, poches waders, ourlet bas pour pêcher en cuissardes.');
INSERT INTO public.products VALUES ('hc-wf6-soie', 0, 'Cordier Roubinet est l''un des derniers cordiers français à tresser ses soies manuellement. Le cœur est monté sur un métier vieux d''un siècle, la gaine lissée avec une cire préparée par le fils du fondateur.', 91, '2026-04-21 09:40:59.749', '3,4,5,6,7,8,9,10', 64.90, '2026-04-21 09:40:59.749', '{"grammage":["WF4","WF5","WF6","WF7"],"couleur":["Ivoire","Vert mousse"]}', 'truite,brochet', 'HC-0284-LS6', 4.80, 'Cordier Roubinet', 15, 'Soie WF6F — bobine + détail tresse', 'Soie flottante WF6F Liaison', 42, 'http://localhost:8080/api/uploads/1776724942801-7da5a83e.avif', 'mouche', 'soies-lignes', '{"Grammage":"WF6F","Longueur totale":"27.4 m","Densit\u00e9":"Flottante","C\u0153ur":"Tress\u00e9 16 brins","Pointe":"0.9 mm"}', 'rivière/lac', NULL, 'Profil à avant lourd pour charger rapidement le bas de canne. Cœur tressé 16 brins, gaine lissée à la cire d''abeille. Lancers doux sur 25 mètres.');


--
-- Data for Name: species; Type: TABLE DATA; Schema: public; Owner: hookcook
--

INSERT INTO public.species VALUES ('truite', 0, '3,4,5,6,7,8,9', 'Truite', 'https://loremflickr.com/900/600/brown-trout,fish/all?lock=101', 'Salmo trutta', 'rivière');
INSERT INTO public.species VALUES ('brochet', 0, '5,6,7,8,9,10,11,12,1', 'Brochet', 'https://loremflickr.com/900/600/northern-pike,fish/all?lock=102', 'Esox lucius', 'lac/rivière');
INSERT INTO public.species VALUES ('sandre', 0, '5,6,7,8,9,10,11,12,1', 'Sandre', 'https://loremflickr.com/900/600/zander,fish/all?lock=103', 'Sander lucioperca', 'lac/rivière');
INSERT INTO public.species VALUES ('carpe', 0, '4,5,6,7,8,9,10,11', 'Carpe', 'https://loremflickr.com/900/600/common-carp,fish/all?lock=104', 'Cyprinus carpio', 'étang/lac');
INSERT INTO public.species VALUES ('bar', 0, '3,4,5,6,7,8,9,10,11', 'Bar', 'https://loremflickr.com/900/600/sea-bass,fish/all?lock=105', 'Dicentrarchus labrax', 'mer');
INSERT INTO public.species VALUES ('perche', 0, '3,4,5,6,7,8,9,10,11', 'Perche', 'https://loremflickr.com/900/600/european-perch,fish/all?lock=106', 'Perca fluviatilis', 'lac/rivière');
INSERT INTO public.species VALUES ('silure', 0, '5,6,7,8,9,10', 'Silure', 'https://loremflickr.com/900/600/catfish,river/all?lock=107', 'Silurus glanis', 'rivière');
INSERT INTO public.species VALUES ('ombre', 0, '5,6,7,8,9,10,11,12', 'Ombre', 'https://loremflickr.com/900/600/grayling,fish/all?lock=108', 'Thymallus thymallus', 'rivière');


--
-- Data for Name: techniques; Type: TABLE DATA; Schema: public; Owner: hookcook
--

INSERT INTO public.techniques VALUES ('mouche', 0, 'Mouche');
INSERT INTO public.techniques VALUES ('carnassiers', 0, 'Carnassiers');
INSERT INTO public.techniques VALUES ('peche-fond', 0, 'Pêche au fond');
INSERT INTO public.techniques VALUES ('anglaise', 0, 'Anglaise');
INSERT INTO public.techniques VALUES ('surfcasting', 0, 'Surfcasting');
INSERT INTO public.techniques VALUES ('streetfishing', 0, 'Street-fishing');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hookcook
--

INSERT INTO public.users VALUES (1, 0, NULL, '2026-04-21 09:40:59.536', 'Admin', NULL, '$2a$12$kObfvIHri5YSM5DeCJRyqOtgigcvqYI77Lp1zNYrkxszqdnJgcADS', NULL, '2026-04-21 09:40:59.536', 'ROLE_ADMIN', NULL, 'Hook & Cook', NULL, 'admin@hookcook.fr');


--
-- Name: hibernate_sequence; Type: SEQUENCE SET; Schema: public; Owner: hookcook
--

SELECT pg_catalog.setval('public.hibernate_sequence', 1, true);


--
-- Name: catch_entries catch_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.catch_entries
    ADD CONSTRAINT catch_entries_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: contest_registrations contest_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.contest_registrations
    ADD CONSTRAINT contest_registrations_pkey PRIMARY KEY (id);


--
-- Name: contests contests_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: permits permits_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.permits
    ADD CONSTRAINT permits_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: species species_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.species
    ADD CONSTRAINT species_pkey PRIMARY KEY (id);


--
-- Name: techniques techniques_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.techniques
    ADD CONSTRAINT techniques_pkey PRIMARY KEY (id);


--
-- Name: permits uk_2grmjm612hum35j6jt7n4418a; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.permits
    ADD CONSTRAINT uk_2grmjm612hum35j6jt7n4418a UNIQUE (reference);


--
-- Name: users uk_6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: orders uk_msasak5ul79vpg5fimli8jwrd; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT uk_msasak5ul79vpg5fimli8jwrd UNIQUE (reference);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: catch_entries_user_idx; Type: INDEX; Schema: public; Owner: hookcook
--

CREATE INDEX catch_entries_user_idx ON public.catch_entries USING btree (user_id);


--
-- Name: contest_reg_contest_idx; Type: INDEX; Schema: public; Owner: hookcook
--

CREATE INDEX contest_reg_contest_idx ON public.contest_registrations USING btree (contest_id);


--
-- Name: contest_reg_user_idx; Type: INDEX; Schema: public; Owner: hookcook
--

CREATE INDEX contest_reg_user_idx ON public.contest_registrations USING btree (user_id);


--
-- Name: orders_reference_idx; Type: INDEX; Schema: public; Owner: hookcook
--

CREATE INDEX orders_reference_idx ON public.orders USING btree (reference);


--
-- Name: orders_user_idx; Type: INDEX; Schema: public; Owner: hookcook
--

CREATE INDEX orders_user_idx ON public.orders USING btree (user_id);


--
-- Name: permits_reference_idx; Type: INDEX; Schema: public; Owner: hookcook
--

CREATE INDEX permits_reference_idx ON public.permits USING btree (reference);


--
-- Name: permits_user_idx; Type: INDEX; Schema: public; Owner: hookcook
--

CREATE INDEX permits_user_idx ON public.permits USING btree (user_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: hookcook
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: contest_registrations fk1s8sjd7jay95uhocir4q6ueu1; Type: FK CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.contest_registrations
    ADD CONSTRAINT fk1s8sjd7jay95uhocir4q6ueu1 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders fk32ql8ubntj5uh44ph9659tiih; Type: FK CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk32ql8ubntj5uh44ph9659tiih FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: catch_entries fk7crnpgry48hhldhvbn4vtxm7e; Type: FK CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.catch_entries
    ADD CONSTRAINT fk7crnpgry48hhldhvbn4vtxm7e FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: order_items fkbioxgbv59vetrxe0ejfubep1w; Type: FK CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fkbioxgbv59vetrxe0ejfubep1w FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: permits fkdlirpgjsjlre4xl06v1e4wpf1; Type: FK CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.permits
    ADD CONSTRAINT fkdlirpgjsjlre4xl06v1e4wpf1 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: contest_registrations fkhdpd7utl67hsa3w4piistvrjc; Type: FK CONSTRAINT; Schema: public; Owner: hookcook
--

ALTER TABLE ONLY public.contest_registrations
    ADD CONSTRAINT fkhdpd7utl67hsa3w4piistvrjc FOREIGN KEY (contest_id) REFERENCES public.contests(id);


--
-- PostgreSQL database dump complete
--


