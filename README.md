# Nokia Snake

A small, offline-first Snake game inspired by the Nokia 3310. It uses only HTML, CSS, and browser JavaScript—no framework, package manager, backend, or external assets.

> **Deployment status:** playable locally; **not deployed to AWS**.

## Gameplay

- Eat food to grow and increase your score. The game speeds up as the score rises.
- Hitting your own body ends the game.
- **Wrap mode** is the default: crossing an edge returns the snake on the opposite side.
- Enable **WALLS: ON** to make an edge collision end the game.
- Your local high score is saved in browser storage.

### Controls

| Action | Control |
| --- | --- |
| Move | Arrow keys or `W` `A` `S` `D` |
| Pause/resume | `Space` or the **PAUSE** button |
| Start/restart | On-screen buttons |
| Mobile movement | On-screen directional pad |
| Sound | **SOUND: ON/OFF** |

## Screenshot

No screenshot is currently committed. Open the application locally to view the game screen.

## Run locally

1. Clone the repository or download its files.
2. Open `index.html` in a modern browser.
3. Select **START** and use the controls above.

No build step, local server, credentials, or internet connection is required.

## Test locally

Run the available automated syntax check with Node.js:

```sh
node --check game.js
```

Manual browser verification should cover movement, food growth, self-collision, edge wrapping, wall mode, pause/resume, mobile controls, sound toggle, high-score persistence, and responsive layout.

## Planned AWS architecture

The intended learning deployment uses a private Amazon S3 bucket in `us-east-2` behind an Amazon CloudFront distribution. CloudFront provides a public HTTPS `cloudfront.net` address and is the only permitted reader of S3 content through Origin Access Control (OAC). S3 Block Public Access stays enabled.

- [Architecture](docs/architecture.md)
- [Deployment guide](docs/deployment.md)
- [Cleanup guide](docs/cleanup.md)

No AWS resources are created by this repository. Deployment requires separate, explicit approval.

## License

[MIT](LICENSE)
