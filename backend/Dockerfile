# Dockerfile pour déploiement sur Render
FROM golang:1.21-alpine AS builder

# Installation des dépendances système
RUN apk add --no-cache git ca-certificates

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers Go
COPY go.mod go.sum ./
RUN go mod download

# Copier le code source
COPY . .

# Construire l'application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o qfqa-backend .

# Image finale
FROM alpine:latest

# Installation des certificats SSL
RUN apk --no-cache add ca-certificates

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S qfqa && \
    adduser -u 1001 -S qfqa -G qfqa

# Répertoire de travail
WORKDIR /app

# Copier le binaire depuis l'étape de build
COPY --from=builder /app/qfqa-backend .
COPY --from=builder /app/migrations ./migrations

# Changer le propriétaire des fichiers
RUN chown -R qfqa:qfqa /app

# Basculer vers l'utilisateur non-root
USER qfqa

# Exposer le port (Render utilise automatiquement PORT)
EXPOSE 8080

# Variables d'environnement par défaut
ENV PORT=8080
ENV PB_DATA=/app/data

# Créer le répertoire de données
RUN mkdir -p /app/data

# Commande de démarrage
CMD ["./qfqa-backend", "serve", "--http=0.0.0.0:8080"]