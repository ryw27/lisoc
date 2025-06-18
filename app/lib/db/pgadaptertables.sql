-- Create enum type for user roles
-- CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER', 'FAMILY');

-- CREATE TABLE verification_token
-- (
--   identifier TEXT NOT NULL,
--   expires TIMESTAMPTZ NOT NULL,
--   token TEXT NOT NULL,
 
--   PRIMARY KEY (identifier, token)
-- );
 
-- CREATE TABLE accounts
-- (
--   id SERIAL,
--   "userId" INTEGER NOT NULL,
--   type VARCHAR(255) NOT NULL,
--   provider VARCHAR(255) NOT NULL,
--   "providerAccountId" VARCHAR(255) NOT NULL,
--   refresh_token TEXT,
--   access_token TEXT,
--   expires_at BIGINT,
--   id_token TEXT,
--   scope TEXT,
--   session_state TEXT,
--   token_type TEXT,
 
--   PRIMARY KEY (id)
-- );
 
-- CREATE TABLE sessions
-- (
--   id SERIAL,
--   "userId" INTEGER NOT NULL,
--   expires TIMESTAMPTZ NOT NULL,
--   "sessionToken" VARCHAR(255) NOT NULL,
 
--   PRIMARY KEY (id)
-- );
 
CREATE TABLE IF NOT EXISTS users
(
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  role user_role NOT NULL,
  username varchar(50) NOT NULL UNIQUE,
  password varchar(100) NOT NULL,
  createon TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastlogin TIMESTAMPTZ,
  address varchar(100),
  city varchar(50),
  state varchar(4),
  zip varchar(10),
  phone varchar(20),
  ischangepwdnext BOOLEAN,
  status boolean NOT NULL DEFAULT TRUE,
  notes varchar(200)
);

CREATE TABLE IF NOT EXISTS family_user
(
    familyid SERIAL PRIMARY KEY,
    userid TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    fatherfirsten VARCHAR(50),
    fatherlasten VARCHAR(50),
    fathernamecn VARCHAR(50),
    motherfirsten VARCHAR(50),
    motherlasten VARCHAR(50),
    mothernamecn VARCHAR(50),
    address2 VARCHAR(100),
    phonealt VARCHAR(20),
    emailalt VARCHAR(100),
    lastmodify TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS teacher_user
(
    teacherid SERIAL PRIMARY KEY,
    userid TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    namecn VARCHAR(50) NOT NULL,
    namelasten VARCHAR(50) NOT NULL,
    namefirsten VARCHAR(50) NOT NULL,
    classid INT REFERENCES classes(classid) NOT NULL,
    address VARCHAR(100),
    address2 VARCHAR(100),
    familyid INT REFERENCES family_user(familyid) NOT NULL,
    createby VARCHAR(50) NOT NULL,
    updateby VARCHAR(50) NOT NULL,
    updateon TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(300)
);



CREATE TABLE IF NOT EXISTS admin_user
(
    adminid SERIAL PRIMARY KEY,
    userid TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    roleid INT REFERENCES adminrole(roleid) NOT NULL,
    namecn VARCHAR(50) NOT NULL,
    namelasten VARCHAR(50) NOT NULL,
    namefirsten VARCHAR(50) NOT NULL,
    address2 VARCHAR(100),
    familyid INT REFERENCES family_user(familyid),
    createby VARCHAR(50) NOT NULL,
    updateby VARCHAR(50) NOT NULL,
    updateon TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ischangepwdnext BOOLEAN NOT NULL DEFAULT FALSE,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    notes VARCHAR(300)
);

