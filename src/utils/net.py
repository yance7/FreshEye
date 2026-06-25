"""
URL 安全工具：防止 SSRF（服务器端请求伪造）。

提供 URL 校验与安全抓取，拦截指向内网/环回/链路本地地址的请求。
"""
from __future__ import annotations

import ipaddress
import logging
import os
import socket
from typing import Any
from urllib.parse import urlparse

import requests

logger = logging.getLogger(__name__)

_ALLOWED_SCHEMES = ("http", "https")
_DEFAULT_TIMEOUT = 10


def _is_disallowed_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """判断 IP 是否属于禁止访问的私有/内网范围。"""
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def validate_url(url: str) -> None:
    """
    校验用户提供的 URL 是否安全（scheme 合法、主机不指向内网/环回地址）。

    Args:
        url: 待校验的 URL 字符串。

    Raises:
        ValueError: URL 为空、scheme 非法，或主机解析到禁止访问的 IP。
    """
    if not url or not isinstance(url, str):
        raise ValueError("URL must be a non-empty string")

    parsed = urlparse(url)
    if parsed.scheme not in _ALLOWED_SCHEMES:
        raise ValueError(f"URL scheme must be one of {_ALLOWED_SCHEMES}, got '{parsed.scheme}'")

    if not parsed.hostname:
        raise ValueError("URL must contain a hostname")

    allowlist = os.getenv("FISH_AGENT_URL_ALLOWLIST")
    if allowlist:
        allowed_hosts = {h.strip().lower() for h in allowlist.split(",") if h.strip()}
        if parsed.hostname.lower() not in allowed_hosts:
            raise ValueError(f"Host '{parsed.hostname}' is not in the allowlist")

    try:
        resolved = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror as exc:
        raise ValueError(f"Cannot resolve host '{parsed.hostname}': {exc}") from exc

    for family, _socktype, _proto, _canon, sockaddr in resolved:
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        if _is_disallowed_ip(ip):
            raise ValueError(
                f"Host '{parsed.hostname}' resolves to a private/loopback address ({ip}), "
                "which is blocked to prevent SSRF"
            )


def safe_fetch(
    url: str,
    *,
    timeout: int = _DEFAULT_TIMEOUT,
    stream: bool = False,
    headers: dict[str, str] | None = None,
    **kwargs: Any,
) -> requests.Response:
    """
    校验 URL 后发起 HTTP 请求，禁用自动重定向以防止 SSRF 绕过。

    Args:
        url: 待抓取的 URL（必须 http/https 且不指向内网）。
        timeout: 请求超时秒数。
        stream: 是否流式下载。
        headers: 自定义请求头。
        **kwargs: 透传给 requests.get 的其他参数。

    Returns:
        requests.Response 对象。

    Raises:
        ValueError: URL 未通过安全校验。
        requests.RequestException: 请求失败。
    """
    validate_url(url)
    response = requests.get(
        url,
        timeout=timeout,
        stream=stream,
        allow_redirects=False,
        headers=headers,
        **kwargs,
    )
    return response
