# Utugi Junior Secondary School Learning Resource Platform

A modern, mobile-first school website and Digital Learning Resource Centre for a Kenyan CBC junior secondary school.
The platform operates entirely as a static site without a traditional backend database. All content is driven by JSON files and managed via Decap CMS.

## Content Management (Decap CMS)

You can manage resources, announcements, notes, and gallery images without editing code.

### Setup
1. Deploy the site to **Netlify**.
2. Go to your Netlify dashboard and enable **Identity**.
3. Enable **Git Gateway** under Settings -> Identity -> Services.
4. Invite yourself as a user under the Identity tab.

### Updating Content
1. Navigate to your website URL and add `/admin/` (e.g., `https://your-site.netlify.app/admin/`).
2. Log in using the Netlify Identity credentials you created.
3. Use the CMS dashboard to add, edit, or delete:
   - Learning Resources (Pictures, Assignments, Worksheets)
   - Class Notes
   - Announcements
   - Gallery Images
4. Changes made in the CMS will automatically push a commit to your GitHub repository and trigger a new Netlify build.

## Deployment

### Netlify
1. Push this folder to GitHub
2. Connect the repo to Netlify
3. Set publish directory to `/` (root)
4. Build command: Leave empty
5. **Ensure Netlify Identity and Git Gateway are enabled for the CMS to function.**

## File Structure
```
utugi-school/
├── index.html              # Home page with Announcements & Resource CTA
├── resources.html          # Dynamic Learning Resources page
├── notes.html              # Dynamic Class Notes page
├── announcements.html      # Dynamic Announcements feed
├── pages/                  # Static Pages (About, Academics, Admissions, Contact, Gallery)
├── admin/                  
│   ├── index.html          # Decap CMS Interface
│   └── config.yml          # Decap CMS Configuration
├── data/                   # JSON Data Files (Managed by CMS)
│   ├── resources.json
│   ├── notes.json
│   ├── announcements.json
│   └── gallery.json
├── assets/
│   ├── css/                # Main, responsive, and resource-specific styles
│   ├── js/                 
│   │   ├── search.js       # Core JSON data fetching, caching, and filtering engine
│   │   ├── main.js         # Navigation, animations
│   │   └── *.js            # Page-specific controllers
│   └── images/
└── netlify.toml            # Build configurations
```
