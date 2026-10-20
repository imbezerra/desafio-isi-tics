-- Minúsculas Unicode podem ter mais pontos de código que o nome original.
-- A API mantém o limite de 60 caracteres em clubes.nome; a chave auxiliar não o repete.
ALTER TABLE "clubes" ALTER COLUMN "nome_normalizado" TYPE TEXT;
