# The Super 7 — WordPress theme (install on Fasthosts)

This folder contains a custom WordPress theme (`the-super-7/`) built from the
static site. It includes the homepage, the interactive prediction demo, and a
Rules & T&Cs page template.

## What you need first

Being your **registrar** (the domain) is not enough to run WordPress. You also
need a **Fasthosts hosting package** that supports PHP/MySQL:

- **Fasthosts WordPress Hosting** (easiest — WordPress is pre-installed), or
- **Fasthosts Web/Cloud Hosting** (use the control panel's 1-click WordPress
  installer).

Point your `thesuper7.com` domain at that hosting package (in the Fasthosts
control panel, under your domain's DNS / "linked hosting").

## Step 1 — Install WordPress (if not already)

1. Log in to the Fasthosts control panel.
2. Open your hosting package → find **WordPress** (or "1-click installs").
3. Install WordPress onto `thesuper7.com`. Note the admin username/password.

## Step 2 — Upload this theme

You have the file **`the-super-7.zip`** (next to this guide).

1. Go to `https://thesuper7.com/wp-admin` and log in.
2. **Appearance → Themes → Add New → Upload Theme**.
3. Choose `the-super-7.zip`, click **Install Now**, then **Activate**.

(Alternative if upload is blocked: use Fasthosts **File Manager** or FTP to copy
the unzipped `the-super-7` folder into `wp-content/themes/`, then activate it in
Appearance → Themes.)

## Step 3 — Set the homepage

The homepage uses the theme's `front-page.php` automatically, but make sure
WordPress is showing it:

1. **Settings → Reading**.
2. "Your homepage displays" → either **Your latest posts** (the front page
   template is used regardless), or create a blank Page and set it as the static
   homepage. Either works — `front-page.php` takes priority.

## Step 4 — Create the Rules page

1. **Pages → Add New**.
2. Title: **Rules** (this gives it the slug `rules`). Leave the content empty.
3. **Publish.**

The theme's `page-rules.php` template fills in all the rules content
automatically, and the footer/FAQ links to `/rules/` will work.

## Step 5 — Favicon / site icon (optional)

The logo is used as the favicon automatically. To set it properly:
**Appearance → Customize → Site Identity → Site Icon** and upload the logo.

## Notes

- The prediction slip is a front-end demo (saves in the browser). No database,
  accounts, or real prizes yet.
- The "Notify me" email box is front-end only. To actually collect emails,
  install a form/newsletter plugin (e.g. WPForms, Fluent Forms, MailPoet) and
  swap the form in `front-page.php`, or point it at Mailchimp.
- The X (Twitter) link points to a placeholder `x.com/thesuper7` — update it in
  `footer.php` (and the contact line in `page-rules.php`).
- `banner.png` is very large (17717px). Resize it before using it anywhere on
  the live site to keep pages fast.

## Theme structure

```
the-super-7/
├── style.css         # theme header + design tokens + all styles
├── functions.php     # enqueues styles, fonts, and the demo script
├── header.php        # site header (logo + nav)
├── footer.php        # site footer (nav, X link, legal)
├── front-page.php    # the homepage
├── page-rules.php    # Rules & T&Cs (for a page with slug "rules")
├── index.php         # fallback template
├── js/app.js         # interactive prediction demo
└── brand/assets/     # logo + banners
```
