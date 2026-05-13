#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
[DEPRECATED] PJ19 ローカル shim → ~/workspace/scripts/check_kw_duplicate.py へ転送

2026-05-13 抽象化により本体は ~/workspace/scripts/ に移動。
PJ19 のコンフィグは ~/workspace/scripts/kw-duplicate-configs/PJ19.yaml。
本ファイルは既存呼び出しの後方互換のために残してある（gc-article Agent等）。
"""
import os
import sys

GENERIC = os.path.expanduser("~/workspace/scripts/check_kw_duplicate.py")
args = [GENERIC, "--pj", "PJ19"] + sys.argv[1:]
os.execv(sys.executable, [sys.executable] + args)
