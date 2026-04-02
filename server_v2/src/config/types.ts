export type NodeEnv = 'test' | 'local' | 'dev' | 'development' | 'stage' | 'production' | 'prod';

export interface AppConfig {
	nodeEnv: NodeEnv;
	jwtSecret: string;
	jwtExpiresIn: string;
	adminUsername: string;
	adminPassword: string;
}
