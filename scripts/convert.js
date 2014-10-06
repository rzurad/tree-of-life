#!/usr/local/bin/node

(function () {
    "use strict";

    var fs = require('fs'),
        path = require('path'),
        XmlStream = require('xml-stream'),

        stream = fs.createReadStream(path.join(__dirname, '../xml/tol.xml')),
        xml = new XmlStream(stream),

        lookup = {}, // hash object to easily lookup parsed NODEs by ID
        root; // will be the normalized root node for the parsed tree

    // make sure to collect all children nodes we care about, otherwise xml-stream
    // will reduce them all to one entry.
    xml.collect('NODE'); // children of the current NODE
    xml.collect('OTHERNAME'); //altername names for this current NODE

    // this callback will fire when a NODE has completely finished parsing.
    // The nice thing about this is that we are assured that each NODE containing
    // NODES children won't reach this callback until all of those children have
    // already been parsed, normalized, and thrown into the lookup, allowing us to easily
    // reconstruct the normalized tree.
    xml.on('endElement: NODE', function (node) {
        var $attrs = node['$'],
            normalized = { id: +$attrs.ID };

        if (node.NAME) {
            normalized.name = node.NAME;
        } else {
            normalized.internal = 1;
        }

        // to reduce the size of the payload, do not include integer fields on the
        // normalized JSON object whose value is "0", or empty string or "null".
        // Any consumer can normalize appropriately or
        // keep the convention, for example, that `!normalized.confidence` means this node has
        // a confidence level of "confident". I know this sounds wierd, but we're trying to
        // send 215 megabytes of XML data to a browser, so everything to make this output small, yet
        // still somewhat readable is a-okay.
        if (node.DESCRIPTION) { normalized.description = node.DESCRIPTION; }
        if (+$attrs.HASPAGE) { normalized.hasPage = +$attrs.HASPAGE; }
        if (+$attrs.PHYLESIS) { normalized.phylesis = +$attrs.PHYLESIS; }
        if (+$attrs.INCOMPLETESUBGROUPS) { normalized.incompleteSubgroups = +$attrs.incompleteSubgroups; }
        if (+$attrs.ANCESTORWITHPAGE) { normalized.ancestorPage = +$attrs.ANCESTORWITHPAGE; }
        if (+$attrs.EXTINCT) { normalized.extinct = +$attrs.EXTINCT; }
        if (+$attrs.CONFIDENCE) { normalized.confidence = +$attrs.confidence; }
        if (+$attrs.LEAF) { normalized.leaf = +$attrs.leaf; }
        if (+$attrs.ITALICIZENAME) { normalized.italicizeName = +$attrs.ITALICIZENAME; }
        if (+$attrs.SHOWAUTHORITY) { normalized.showAuthority = +$attrs.SHOWAUTHORITY; }
        if (+$attrs.SHOWAUTHORITYCONTAINING) { normalized.showAuthorityContaining = +$attrs.SHOWAUTHORITYCONTAINING; }
        if (+$attrs.IS_NEW_COMBINATION) {
            normalized.isNewCombination = +$attrs.IS_NEW_COMBINATION;

            if ($attrs.COMBINATION_DATE !== 'null') {
                normalized.combinationDate = $attrs.COMBINATION_DATE;
            }
        }

        if (node.OTHERNAMES && node.OTHERNAMES.OTHERNAME.length) {
            normalized.otherNames = node.OTHERNAMES.OTHERNAME.map(function (name) {
                var $attrs = name['$'],
                    obj = { name: name.NAME, sequence: +$attrs.SEQUENCE };

                if (+$attrs.ISIMPORTANT) { obj.isImportant = +$attrs.ISIMPORTANT; }
                if (+$attrs.ISPREFERRED) { obj.isPreferred = +$attrs.ISPREFERRED; }
                if (+$attrs.ITALICIZENAME) { obj.italicizeName = +$attrs.ITALICIZENAME; }
                if ($attrs.DATE !== 'null') { obj.date = $attrs.DATE; }
                
                return obj;
            });
        }

        if (+$attrs.CHILDCOUNT > 0) {
            normalized.nodes = node.NODES.NODE.map(function (child) {
                return lookup[child['$'].ID];
            });
        }

        lookup[normalized.id] = normalized;
        root = normalized;
    });

    xml.on('end', function () {
        console.log(JSON.stringify(root));
    });

    xml.on('error', function (message) {
        console.log(message);
    });
}());
