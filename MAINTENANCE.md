# Application Maintenance & Update Workflow

This guide explains how to update your application features and how to handle a domain change in the future.

---

## 1. Standard Development Workflow

When you want to add new features or fix bugs, follow this flow:

### Step 1: Local Development
- Make your changes in your local IDE.
- Test them locally using your local environment.

### Step 3: Push to GitHub
Once you are happy with the changes:
```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

### Step 4: Deploy to VM
SSH into your Oracle VM and run:
```bash
cd rootsearch
sudo git pull origin main
sudo docker compose up -d --build
```
> [!TIP]
> Using `--build` ensures that Docker recreates the images with your new code.

---

## 2. How to Change the Domain

If you decide to change your domain in the future (e.g., from `rootseach.tech` to `newdomain.com`), you must update several places:

### A. Environment Variables
Edit `.env.production` on the VM:
```bash
nano .env.production
```
Update these lines:
- `NEXTAUTH_URL=https://newdomain.com`
- `ALLOWED_ORIGINS=http://localhost,https://newdomain.com`

### B. Nginx Configuration
Edit `nginx/nginx.conf` on the VM and replace all instances of the old domain with the new one.

### C. SSL Certificates
You will need to generate a new certificate for the new domain:
```bash
sudo docker compose down
sudo certbot certonly --standalone -d newdomain.com -d www.newdomain.com
```

### D. Google Cloud Console
Update your OAuth 2.0 Credential settings:
1. Update **Authorized JavaScript origins** with `https://newdomain.com`.
2. Update **Authorized redirect URIs** with `https://newdomain.com/api/auth/callback/google`.

---

## 3. Database Management (SQLite)

In your current setup, the databases are stored in the `data/` directory.

- **Backup**: We recommend copying the `.db` files from the VM to your local machine periodically for safety.
- **Volume Mapping**: Your databases are persisted in a Docker volume, so they won't be lost when you restart the containers.

---

## 4. Helpful Commands

- **View Logs**: `sudo docker compose logs -f` (Use this if something isn't working)
- **Check Status**: `sudo docker compose ps`
- **Restart Services**: `sudo docker compose restart`
