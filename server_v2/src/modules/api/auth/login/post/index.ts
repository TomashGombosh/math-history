import type { Engine } from '@interfaces/types';
import { validateAdminCredentials, signAdminToken } from '@lib/admin-auth';
import { ResponseWriter } from '@lib/response-writer';

export const publicResource = true;

export const handler = async (ctx: Engine) => {
	const { username, password } = ctx.req.body as { username?: string; password?: string };
	try {
		validateAdminCredentials(username, password, ctx.config);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'CREDENTIALS_REQUIRED') {
			return ResponseWriter.BadRequest({ message: "Потрібно ввести логін і пароль" });
		}
		if (msg === 'BAD_CREDENTIALS') {
			return ResponseWriter.Unauthorized({ message: 'Невірний логін або пароль' });
		}
		throw e;
	}

	const token = signAdminToken(String(username), ctx.config);
	return ResponseWriter.Success({ token });
};
