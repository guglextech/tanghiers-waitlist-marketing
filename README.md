# Lottoforecast Waitlist

Full-page early-access offer for [Lottoforecast.com](https://lottoforecast.com).

## Flow

1. Want an exclusive offer?
2. Name + email
3. Phone + age/privacy consents
4. Confirmation

Posts to `POST https://tanghiers-forecast-api.onrender.com/v1/waitlist`. Consent copy/versions load from `GET /v1/legal/consents`.

## Run

```bash
npx serve .
```
