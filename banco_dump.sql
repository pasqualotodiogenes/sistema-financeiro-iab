PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('root', 'admin', 'editor', 'viewer')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    lastLogin TEXT
  );
INSERT INTO users VALUES('1','davi.quadros','$2b$10$G95TiH0tXIXiY7ls.bE.ludbCo1.vYvbVS3GWjtBwEZQhwYFmcfUy','root','Administrador Root','root@iabigrejinha.com','2025-07-14T22:50:04.085Z','2025-07-20T00:25:27.116Z');
INSERT INTO users VALUES('guest','visitante','','viewer','Visitante','','2025-07-15T02:41:37.662Z',NULL);
CREATE TABLE user_permissions (
    userId TEXT PRIMARY KEY,
    canCreate BOOLEAN NOT NULL DEFAULT 0,
    canEdit BOOLEAN NOT NULL DEFAULT 0,
    canDelete BOOLEAN NOT NULL DEFAULT 0,
    canManageUsers BOOLEAN NOT NULL DEFAULT 0,
    canViewReports BOOLEAN NOT NULL DEFAULT 0,
    canManageCategories BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
INSERT INTO user_permissions VALUES('1',1,1,1,1,1,1);
INSERT INTO user_permissions VALUES('guest',0,0,0,0,1,0);
CREATE TABLE user_categories (
    userId TEXT NOT NULL,
    categoryId TEXT NOT NULL,
    PRIMARY KEY (userId, categoryId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
INSERT INTO user_categories VALUES('guest','cantinas');
INSERT INTO user_categories VALUES('guest','missoes');
INSERT INTO user_categories VALUES('guest','melhorias');
INSERT INTO user_categories VALUES('guest','jovens');
INSERT INTO user_categories VALUES('guest','eventos');
INSERT INTO user_categories VALUES('guest','aquisicao');
INSERT INTO user_categories VALUES('1','aquisicao');
INSERT INTO user_categories VALUES('1','cantinas');
INSERT INTO user_categories VALUES('1','eventos');
INSERT INTO user_categories VALUES('1','jovens');
INSERT INTO user_categories VALUES('1','melhorias');
INSERT INTO user_categories VALUES('1','missoes');
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    isSystem BOOLEAN NOT NULL DEFAULT 0,
    isPublic BOOLEAN NOT NULL DEFAULT 0,
    slug TEXT
  );
INSERT INTO categories VALUES('cantinas','Cantinas','Coffee','amber',1,0,'cantinas');
INSERT INTO categories VALUES('missoes','Missões','Heart','red',1,0,'missoes');
INSERT INTO categories VALUES('melhorias','Melhorias','Wrench','blue',1,0,'melhorias');
INSERT INTO categories VALUES('jovens','Jovens','Users','green',1,0,'jovens');
INSERT INTO categories VALUES('eventos','Eventos Especiais','Calendar','purple',1,0,'eventos-especiais');
INSERT INTO categories VALUES('aquisicao','Aquisição','ShoppingCart','orange',1,0,'aquisicao');
CREATE TABLE movements (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    category TEXT NOT NULL,
    createdBy TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (category) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
  );
CREATE TABLE avatars (
    userId TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('upload', 'initials', 'icon')),
    data TEXT NOT NULL,
    backgroundColor TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
INSERT INTO sessions VALUES('ec74f424df1395de93305691216d6c27abbb6d997db4f7dc02508ead576ffed4','1','2025-07-15T22:56:12.196Z');
INSERT INTO sessions VALUES('00d91e4a9b21c899771ffbbabcf5743a74972a136071b0a9f728041d743ab6f9','1','2025-07-15T22:56:24.271Z');
INSERT INTO sessions VALUES('6b87b299ab585708121024c718cb4a5e606c758673c0a1bd0a09f1259004d395','1','2025-07-16T00:31:44.649Z');
INSERT INTO sessions VALUES('6516bb4930b579b4e38bbc337cd97f671d9b4d41bfc9a5d2e872b71dfef2cc63','1','2025-07-16T00:31:57.523Z');
INSERT INTO sessions VALUES('803d6a74c4e6744782f4fd2db447612f8886eaee0c187642a687d6c353aa56a7','1','2025-07-16T00:37:11.679Z');
INSERT INTO sessions VALUES('9ca4c5515971ae01f837f1a7e6b2707f753156fa65a60153d75b7374c7a5b9ca','1','2025-07-16T01:29:30.248Z');
INSERT INTO sessions VALUES('138e029239131f1ecc9e0eb158a7a49bd70e686f0f54bde7b2f11e1aebf6bd09','1','2025-07-16T02:07:21.257Z');
INSERT INTO sessions VALUES('fc70f1452042c38e05e57cdc83a3ba18969bfb0fafcc00622936ff91615a943b','1','2025-07-16T02:12:19.440Z');
INSERT INTO sessions VALUES('0c6efa091e965f112078d65e6b901fcff4ba378ce231d9f1a5bca3eca29cb0c5','1','2025-07-16T02:20:04.490Z');
INSERT INTO sessions VALUES('079a64f5169b879edc4fa54dc195b175eb01cac5be2a3589b9692eddcf1b7b56','1','2025-07-16T02:41:08.676Z');
INSERT INTO sessions VALUES('guest-token-fd26570a523407db837759c7486c8ae8','guest','2025-07-15T04:41:37.662Z');
INSERT INTO sessions VALUES('guest-token-08fe67019741622c5b5e16bacc70b3b2','guest','2025-07-15T04:41:44.438Z');
INSERT INTO sessions VALUES('d539e2909f0b803f37e48d61eec7d2a5918c114f9878aaa0718447b6cea1db8c','1','2025-07-16T03:11:46.370Z');
INSERT INTO sessions VALUES('guest-token-793c13c4a5b61cded0ce00edc4ae0a49','guest','2025-07-15T05:12:18.238Z');
INSERT INTO sessions VALUES('guest-token-61f49969c99ce16ffd2f2265632afeda','guest','2025-07-15T05:13:37.561Z');
INSERT INTO sessions VALUES('guest-token-77fdfdc9a3cebed11ca9e7a387fca21b','guest','2025-07-15T05:15:16.380Z');
INSERT INTO sessions VALUES('9a66aab2bc8bf4e036f4fdd1dd7d966fe18e872ae25603667cec942859ee6e61','1','2025-07-16T03:15:35.206Z');
INSERT INTO sessions VALUES('1fbd787421fceda47cf05ddcb6bce99aed38bf8a987b576b0f8af37a3d81500b','1','2025-07-16T03:16:02.556Z');
INSERT INTO sessions VALUES('0aed5648d376424882ec6d08bb0e0ea454722085535205577474a4715019a3d0','1','2025-07-16T10:35:52.885Z');
INSERT INTO sessions VALUES('a3b47658b185cb2a1c28b46477692287b0dce06b8d6a0760d1a2eedc972086e3','1','2025-07-16T10:41:00.252Z');
INSERT INTO sessions VALUES('53721a4536261e152c10e5e2601fa7236f7c3e4701518eb6855918fc78c82401','1','2025-07-16T23:09:34.667Z');
INSERT INTO sessions VALUES('db702f77cd804c961e66d2f199b398005ba0173812dd66002daf0c3632656732','1','2025-07-16T23:59:45.739Z');
INSERT INTO sessions VALUES('bd5a1ae95b2b8776b19476c7c1487fe796b9e8466a1475bb49ccd8fb6d0345d1','1','2025-07-17T00:17:50.974Z');
INSERT INTO sessions VALUES('d30c0d655915d67ae9f0c4b24fcf2ec3ea7fc75317fe6d6e5b0eff05d5283367','1','2025-07-17T01:16:15.498Z');
INSERT INTO sessions VALUES('7df563313f13720da38a0a8f3b350058106ad13548479bf64969b78883175182','1','2025-07-17T02:03:44.264Z');
INSERT INTO sessions VALUES('guest-token-229f91001a04cd7df813c0a745aa391c','guest','2025-07-17T03:56:51.787Z');
INSERT INTO sessions VALUES('guest-token-d6c0b96c79950e7cebaca11859197fb2','guest','2025-07-17T03:56:59.569Z');
INSERT INTO sessions VALUES('guest-token-ee0d53a93092b24ba5ba507e58a727e5','guest','2025-07-17T04:00:13.050Z');
INSERT INTO sessions VALUES('944f8700290c7e0c33730e8007ca5a0992206301091ff9e6b426258b71c9c1c3','1','2025-07-18T02:00:34.539Z');
INSERT INTO sessions VALUES('guest-token-323580f7ee500b6f2d6565337c48650c','guest','2025-07-17T04:14:19.799Z');
INSERT INTO sessions VALUES('112fe427f3ae88698819752ec4d1dceea6f3e7efcc04c5a4f1aa567c99a4823a','1','2025-07-18T02:39:47.018Z');
INSERT INTO sessions VALUES('322b39caf0ea3488986461840a27c7f4bc8a6b16728d08e8672079884e423ed7','1','2025-07-18T03:02:59.120Z');
INSERT INTO sessions VALUES('guest-token-c9229a4bea91760dd250e89be227514c','guest','2025-07-17T13:23:16.717Z');
INSERT INTO sessions VALUES('9f9781d2d4adc2faae8a6433426fdc9caf93575ebc122e3a2dcc53ffdcc44346','1','2025-07-18T11:25:26.576Z');
INSERT INTO sessions VALUES('2eff2d7f54fa59eed3268ffd1ff207025a36df08aa16ec49ac56e799be89dc0c','1','2025-07-18T11:32:45.698Z');
INSERT INTO sessions VALUES('404b21851d0c50b1164790279d5ca6912aba8d19bc633e63c716d28ec2281987','1','2025-07-18T11:42:36.309Z');
INSERT INTO sessions VALUES('guest-token-aad83d03f327dc65046def23166354a4','guest','2025-07-19T02:19:03.056Z');
INSERT INTO sessions VALUES('guest-token-13a525e4d2e3a9276bd1bdf8aae4edc7','guest','2025-07-19T02:20:39.322Z');
INSERT INTO sessions VALUES('guest-token-aa64a5ab999eff56dd3e78e51017b54c','guest','2025-07-19T02:20:42.598Z');
INSERT INTO sessions VALUES('guest-token-f53862f776385510a8813448c456a843','guest','2025-07-19T02:26:37.387Z');
INSERT INTO sessions VALUES('1f00e7121d91c65574fef124b73a3f8f7a32f56136bbbee21b283f52a0f134cf','1','2025-07-20T00:51:44.431Z');
INSERT INTO sessions VALUES('guest-token-6d7bb3b3d6416bf5047be3923c228444','guest','2025-07-19T02:57:19.912Z');
INSERT INTO sessions VALUES('guest-token-5dd773e9445bda873decd6efb0fe3f15','guest','2025-07-19T03:10:00.823Z');
INSERT INTO sessions VALUES('guest-token-72030128a169f688b335997d9812ce8f','guest','2025-07-19T03:11:21.539Z');
INSERT INTO sessions VALUES('guest-token-2c94b8e72462649a9db01339f46ed4af','guest','2025-07-19T03:14:47.597Z');
INSERT INTO sessions VALUES('guest-token-6d881d66ece10dbb80a8a4a402bd5a83','guest','2025-07-19T03:23:42.918Z');
INSERT INTO sessions VALUES('2a38ed89f26586c7ab2679cee175e39b734c62f1d42a93cc2f12850e48e7e2f2','1','2025-07-20T01:34:09.838Z');
INSERT INTO sessions VALUES('1a6919483f218fea2b76ca25563e712b127ade708c070061f30022c9a32902d5','1','2025-07-20T01:41:15.818Z');
INSERT INTO sessions VALUES('2b5854dfbfa8af01118170c07d582ede379779f44fb95cc3324539f23d70a8f5','1','2025-07-20T02:10:34.931Z');
CREATE TABLE church_profile (
        id TEXT PRIMARY KEY DEFAULT 'main',
        name TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        image TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
INSERT INTO church_profile VALUES('main','IAB Igrejinha','','','contato@iabigrejinha.com',NULL,'/api/assets/church/1752971186429_IMG_9703.jpg','2025-07-15 00:50:14','2025-07-20 00:26:26');
CREATE INDEX idx_categories_slug ON categories(slug);
COMMIT;
