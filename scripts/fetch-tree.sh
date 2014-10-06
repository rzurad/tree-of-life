#!/bin/bash
curl "http://tolweb.org/onlinecontributors/app?service=external&page=xml/TreeStructureService&node_id=1" -o tol.xml
curl "http://tolweb.org/onlinecontributors/app?service=external&page=xml/TreeStructureService&node_id=4" -o archaea.xml
