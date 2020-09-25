#!/usr/bin/python

import json
import sys

with open(sys.argv[1], "r") as f:
    data = json.loads(f.read())
    print(data["version"])
