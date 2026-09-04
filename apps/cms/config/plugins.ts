import { parseSaslCredentials } from '../src/lib/smtp-credentials';

export default ({ env }) => {
  // Present-but-empty `auth` is treated differently by nodemailer than a
  // missing `auth` key entirely, so we only spread it in when credentials
  // actually parse — this is what lets local dev boot with SMTP_SASL_USERS
  // unset.
  const smtpCredentials = parseSaslCredentials(env('SMTP_SASL_USERS', ''));

  return {
    email: {
      config: {
        provider: 'nodemailer',
        providerOptions: {
          host: env('SMTP_HOST'),
          port: env.int('SMTP_PORT', 587),
          // Port 587 is STARTTLS submission, not implicit TLS — secure must
          // stay false and requireTLS true, or nodemailer either fails to
          // connect or sends the AUTH handshake in the clear.
          secure: false,
          requireTLS: true,
          tls: {
            // The in-cluster postfix relay (mail.mail-system.svc.cluster.local)
            // presents a self-signed cert (bokysan/docker-postfix chart
            // default). The hop never leaves the cluster network, so strict
            // verification is off by default; set SMTP_TLS_REJECT_UNAUTHORIZED
            // to re-enable it once the relay has a trusted cert.
            rejectUnauthorized: env.bool('SMTP_TLS_REJECT_UNAUTHORIZED', false),
          },
          ...(smtpCredentials && { auth: smtpCredentials }),
        },
        settings: {
          // The relay enforces ALLOWED_SENDER_DOMAINS — EMAIL_DEFAULT_FROM
          // must stay on a domain postfix is configured to allow, or it
          // rejects the message outright.
          defaultFrom: env('EMAIL_DEFAULT_FROM', 'no-reply@ssegning.com'),
          defaultReplyTo: env('EMAIL_DEFAULT_REPLY_TO', 'hello@ssegning.com'),
        },
      },
    },
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          baseUrl: env('S3_PUBLIC_BASE'),
          s3Options: {
            endpoint: env('S3_ENDPOINT'),
            region: env('S3_REGION', 'us-east-1'),
            forcePathStyle: true,
            credentials: {
              accessKeyId: env('S3_ACCESS_KEY_ID'),
              secretAccessKey: env('S3_SECRET_ACCESS_KEY'),
            },
            params: {
              Bucket: env('S3_BUCKET'),
            },
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
    // Adds a "Rich Text (Tiptap)" custom field type in the Content-Type
    // Builder. It does NOT replace the built-in `richtext` type — the
    // `post.body` field (see src/api/post/content-types/post/schema.json)
    // stays exactly as it is, and none of the bundled bootstrap articles
    // are migrated. An editor opts a *new* field into Tiptap by adding it
    // in the Content-Type Builder, picking "Rich Text (Tiptap)" as the
    // type, and choosing one of the presets below in Advanced Settings.
    //
    // Presets are feature allow-lists (see plugin README "Available
    // Extensions" for the exhaustive key list — anything not listed here
    // is not a valid preset key and fails config validation at startup).
    // They're picked to match what the site's writing actually uses:
    // the bundled articles under src/bootstrap/articles/ lean on
    // headings (## / ###), bold/italic, inline code, fenced code blocks
    // (including ```mermaid diagrams), block quotes, ordered/unordered
    // lists, links, and tables (6 of the 12 articles). They don't use
    // underline, strikethrough, super/subscript, text alignment, text/
    // highlight colors, or inline images (the `post.cover` media field
    // covers imagery today), so those stay off both presets below —
    // add them deliberately if a real piece of content needs them.
    'tiptap-editor': {
      config: {
        presets: {
          // Full-length journal/article body copy — mirrors the feature
          // set the existing Markdown articles actually exercise.
          article: {
            bold: true,
            italic: true,
            underline: true,
            strike: true,
            code: true,
            blockquote: true,
            codeBlock: true,
            bulletList: true,
            orderedList: true,
            horizontalRule: true,
            hardBreak: true,
            // Undo/redo. Easy to overlook because it draws no toolbar
            // button of its own, but without it Ctrl-Z does nothing inside
            // the editor — which is the fastest way to lose a paragraph.
            history: true,
            // Inserts from Strapi's own media library, i.e. the S3/MinIO
            // upload provider already configured above — so article images
            // land in the same bucket the rest of the site serves from.
            mediaLibrary: true,
            // Article bodies only ever use ## and ###; the title itself
            // is the separate `title` field (H1), so levels stop at 4
            // to leave a little headroom without inviting H1/H5/H6 abuse.
            heading: {
              levels: [2, 3, 4],
            },
            link: true,
            table: true,
          },
          // Short-form copy — excerpts, captions, anything that should
          // stay a sentence or two and not grow headings/tables/lists.
          minimal: {
            bold: true,
            italic: true,
            link: true,
          },
        },
      },
    },
  };
};
