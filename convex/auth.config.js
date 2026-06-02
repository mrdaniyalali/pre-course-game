// Convex Auth provider config — tells Convex to trust tokens it issues.
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: 'convex',
    },
  ],
}
