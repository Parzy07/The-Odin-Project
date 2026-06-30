from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
    )

    ib_host: str = "127.0.0.1"
    ib_port: int = 7497
    ib_client_id: int = 1
    ib_readonly: bool = True
    demo_mode: bool = False
    # Use "*" for all origins, or comma-separated list including your LAN IP
    cors_origins: str = "*"
    bind_host: str = "0.0.0.0"
    bind_port: int = 8000


settings = Settings()

