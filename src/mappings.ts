export type SecretMapping = {
	secretPath: string;
	secretName: string;
	envName: string;
};

const ENV_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Parses the `secrets` input. One mapping per line:
 *   /path/to/secret-name > ENV_VAR_NAME
 * Blank lines and lines starting with `#` are ignored.
 */
export const parseSecretMappings = (raw: string): SecretMapping[] => {
	const seenEnvNames = new Set<string>();

	return raw
		.split("\n")
		.map(line => line.trim())
		.filter(line => line !== "" && !line.startsWith("#"))
		.map(line => {
			const parts = line.split(">");
			if (parts.length !== 2) {
				throw new Error(`Invalid secret mapping "${line}". Expected format: /path/to/secret-name > ENV_VAR_NAME`);
			}

			const secretRef = parts[0].trim();
			const envName = parts[1].trim();

			if (!secretRef.startsWith("/")) {
				throw new Error(`Invalid secret mapping "${line}". The secret reference must start with "/"`);
			}

			const lastSlash = secretRef.lastIndexOf("/");
			const secretName = secretRef.substring(lastSlash + 1);
			const secretPath = lastSlash === 0 ? "/" : secretRef.substring(0, lastSlash);

			if (!secretName) {
				throw new Error(`Invalid secret mapping "${line}". Missing secret name after the path`);
			}
			if (!ENV_NAME_REGEX.test(envName)) {
				throw new Error(`Invalid environment variable name "${envName}" in mapping "${line}"`);
			}
			if (seenEnvNames.has(envName)) {
				throw new Error(`Environment variable "${envName}" is mapped more than once`);
			}
			seenEnvNames.add(envName);

			return { secretPath, secretName, envName };
		});
};