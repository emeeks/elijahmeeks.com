# Moving elijahmeeks.com from Bluehost to GitHub Pages

The replacement site can be reviewed at https://emeeks.github.io/elijahmeeks.com/ before changing DNS. GitHub Pages is enabled with GitHub Actions publishing. The custom domain is intentionally not attached yet so the preview URL remains usable while Bluehost still serves the domain.

## Current public DNS (observed October 29, 2026)

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 162.241.24.62 |
| CNAME | www | elijahmeeks.com |
| MX | @ | priority 0, mail.elijahmeeks.com |
| MX | @ | priority 10, elijahmeeks.com |
| A | mail | 162.241.24.62 |
| A | webmail | 162.241.24.62 |
| A | ftp | 162.241.24.62 |
| TXT | @ | v=spf1 ip4:162.241.24.62 a mx include:websitewelcome.com ~all |
| NS | @ | ns1.bluehost.com / ns2.bluehost.com |

No apex AAAA records were returned. This public lookup is not a full zone export: export or capture all DNS records in Bluehost before editing, including DKIM, DMARC, verification records, and subdomains.

## Cutover

1. Review the deployed preview, then set the custom domain to `elijahmeeks.com` in [repository Pages settings](https://github.com/emeeks/elijahmeeks.com/settings/pages), or run `gh api repos/emeeks/elijahmeeks.com/pages --method PUT -f cname=elijahmeeks.com`. Do this before pointing DNS to GitHub. The default Pages URL will then redirect to the custom domain.
2. In Bluehost DNS for **elijahmeeks.com**, retain the existing `mail` A record. Remove the priority 10 MX record targeting `elijahmeeks.com` before repointing the apex: it would otherwise try delivering fallback mail to GitHub. Keep priority 0 MX pointing to `mail.elijahmeeks.com`. The observed SPF record already includes the Bluehost IP explicitly; preserve it and existing mail authentication records.
3. Replace the apex `@` A record with these four A records:

   ```text
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

4. Change `www` CNAME from `elijahmeeks.com` to `emeeks.github.io`. Keep nameservers at Bluehost. Do not edit hajrameeks.com or any unrelated DNS records. Recheck for any apex AAAA records at cutover; none should point to the former host.
5. Wait for DNS propagation (the observed mail TTL is 14400 seconds; web record TTLs may differ), check the domain in Pages settings, and enable **Enforce HTTPS** when GitHub's certificate is ready. GitHub notes this may take up to 24 hours. Verify both `https://elijahmeeks.com` and `https://www.elijahmeeks.com`, an old article bookmark, and inbound/outbound mail if used.

Keep the Bluehost hosting plan active while hajrameeks.com and/or domain email use it. This moves web hosting only; domain registration and DNS remain at Bluehost.

## Rollback

Restore the apex A record to `162.241.24.62` and `www` CNAME to `elijahmeeks.com`. Restore the previous mail configuration from the DNS export if necessary. The original Bluehost site has not been edited or removed. Once the domain resolves back to Bluehost, remove the custom domain from GitHub Pages if abandoning the migration.

## References

- [GitHub Pages custom domain setup and current IP addresses](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
