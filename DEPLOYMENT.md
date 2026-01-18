# Deployment Guide for RootSearch

This guide covers the initial setup on Oracle Cloud and SSL configuration.

## 1. Oracle Cloud Setup
- **Ports**: Open 80 (HTTP) and 443 (HTTPS) in the VCN Security List.
- **Firewall**: Run `sudo firewall-cmd --permanent --add-service=http` and `https` on the VM.

## 2. DNS
- Point `rootseach.tech` and `www.rootseach.tech` to your VM IP: `140.245.19.236`.

## 3. Initial Deploy
```bash
git clone https://github.com/abhinaverma97/rootsearch.git
cd rootsearch
nano .env.production  # Add your keys
sudo docker compose up -d --build
```

## 4. SSL (HTTPS)
1. Stop app: `sudo docker compose down`
2. Run Certbot: `sudo certbot certonly --standalone -d rootseach.tech`
3. Update `nginx/nginx.conf` and `docker-compose.yml` to use `/etc/letsencrypt/live/rootseach.tech/...`
4. Update `.env.production` to use `https://rootseach.tech`
5. Start app: `sudo docker compose up -d --build`

## 5. Google OAuth
- Add `https://rootseach.tech/api/auth/callback/google` to Authorized Redirect URIs in Google Cloud Console.
