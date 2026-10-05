/**
 * Shared pg Pool options. Aiven and similar hosts require TLS even in local dev.
 *
 * If sslmode=* stays on the URL, node-pg enforces cert verification and ignores
 * rejectUnauthorized on the ssl option — strip it and set ssl here instead.
 */
function resolveSsl(connectionString) {
    const url = connectionString ?? '';

    if (process.env.PGSSLMODE === 'disable' || /(?:^|[?&])sslmode=disable/i.test(url)) {
        return false;
    }

    const needsTls =
        process.env.NODE_ENV === 'production' ||
        /(?:^|[?&])sslmode=require/i.test(url) ||
        /\.aivencloud\.com/i.test(url);

    if (needsTls) {
        return { rejectUnauthorized: false };
    }

    return false;
}

function normalizeConnectionString(connectionString) {
    if (!connectionString) return connectionString;
    return connectionString
        .replace(/([?&])sslmode=[^&]*/gi, '$1')
        .replace(/([?&])ssl_mode=[^&]*/gi, '$1')
        .replace(/\?&/, '?')
        .replace(/[?&]$/, '');
}

function getPoolConfig(overrides = {}) {
    const rawUrl = process.env.DATABASE_URL;
    const connectionString = normalizeConnectionString(rawUrl);

    return {
        connectionString,
        ssl: resolveSsl(rawUrl),
        ...overrides,
    };
}

module.exports = { resolveSsl, getPoolConfig };
