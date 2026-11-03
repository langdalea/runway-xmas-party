# Runway Summer Christmas Party 🌺🎄

Invitation site for the Runway end-of-year celebration, Wednesday 2 December 2026.

```
docs/                  ← the website (this is the only folder you publish)
  index.html
  styles.css
  script.js
  config.js            ← organiser email + dates
  secret-santa-data.js ← placeholder until the draw runs
secret-santa/
  draw.js              ← the Secret Santa draw
  participants.txt     ← one name per line
  assignments-PRIVATE.csv  ← created by the draw; git-ignored, never publish
```

The site lives in `docs/` so the private CSV is never inside the folder you upload.

## How RSVPs and nominations work

Everything comes to Aleisha by email (address set in `docs/config.js`):

- **RSVP now** opens a pre-filled email: subject `RSVP: Yes! …`, with blanks for
  name, Secret Santa (yes/no) and dietary requirements.
- **Can't make it?** opens an `RSVP: Can't make it …` email.
- Each **Nominate** button on an award card opens a `2026 Runway Awards nomination: …`
  email with the award already filled in.

Tip: make Outlook rules that move emails with subjects starting `RSVP:` and
`2026 Runway Awards nomination` into their own folders.

If someone's computer has no email app set up, the button may do nothing. The RSVP
section shows the address with a **Copy address** button for them.

## 1. Deploy

**Netlify Drop (easiest):** go to <https://app.netlify.com/drop>, sign in, and drag the
`docs` folder (not the whole project) onto the page. You get a link straight away.
To update later: Netlify → your site → **Deploys** → drag the `docs` folder in again.

**GitHub Pages:** push this project to a GitHub repo, then **Settings → Pages →
Deploy from a branch → `main` / `/docs`**. Every push redeploys automatically.

## 2. Run the Secret Santa draw (after RSVPs close on Fri 6 Nov)

1. Install Node.js (LTS) from <https://nodejs.org> if you don't have it.
2. Go through the `RSVP: Yes!` emails and copy the name of everyone who said **yes** to
   Secret Santa into `secret-santa/participants.txt`, one per line.
3. In a terminal in this folder run:

   ```bash
   node secret-santa/draw.js
   ```

4. Redeploy the `docs` folder (Netlify: drag it in again; GitHub: commit and push
   `docs/secret-santa-data.js`). The reveal box appears on the site automatically.

The draw won't overwrite an existing draw by accident. To redraw (everyone gets new
matches and new codes), run `node secret-santa/draw.js --force`.

## 3. Send codes privately

Open `secret-santa/assignments-PRIVATE.csv` and send each person **only their own code**
(Teams DM or individual email), e.g.:

> Kia ora Sam! Your Secret Santa code is **JANDAL-4821**. Enter it in the "Reveal your
> Secret Santa" box at <site link> to see who you're buying for. Remember: second-hand
> only, no spending limit, and bring it to mini golf! 🎁

Don't put the codes in a group chat or one email with everyone on it.

## 4. Before the night

- Send the dietary requirements from the RSVP emails to Azabu.
- Tally the award nominations. Winners get announced at dinner.
