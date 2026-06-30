from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    ib_host: str = "127.0.0.1"
    ib_port: int = 7497
    ib_client_id: int = 1
    ib_readonly: bool = True
    demo_mode: bool = False
    cors_origins: str = "http://localhost:5173,http://localhost:3000"


settings = Settings()
