/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$

    File:        TypeUtil.java
    Created by:  Dave Reynolds
    Created on:  5 Feb 2010
*/

package com.epimorphics.jsonrdf;

import com.hp.hpl.jena.graph.Node;
import com.hp.hpl.jena.graph.Triple;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.reasoner.TriplePattern;
import com.hp.hpl.jena.reasoner.transitiveReasoner.TransitiveGraphCache;
import com.hp.hpl.jena.reasoner.transitiveReasoner.TransitiveReasoner;
import com.hp.hpl.jena.vocabulary.RDFS;
import com.hp.hpl.jena.vocabulary.XSD;

/**
 * Support for comparing datatypes to reflect XSD type heirarchy
 * 
 * @author <a href="mailto:dave@epimorphics.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class TypeUtil {

    static TransitiveGraphCache tgc ;
    
    static {
        Node sc  = RDFS.subClassOf.asNode();
        tgc = new TransitiveGraphCache(TransitiveReasoner.directSubClassOf, sc);
        addSubClass(tgc, XSD.integer, XSD.decimal);
        addSubClass(tgc, XSD.xlong, XSD.integer);
        addSubClass(tgc, XSD.xint, XSD.xlong);
        addSubClass(tgc, XSD.xshort, XSD.xint);
        addSubClass(tgc, XSD.xbyte, XSD.xshort);
        addSubClass(tgc, XSD.unsignedByte, XSD.xshort);
        addSubClass(tgc, XSD.unsignedInt, XSD.xlong);
        addSubClass(tgc, XSD.unsignedShort, XSD.xint);
        addSubClass(tgc, XSD.unsignedLong, XSD.integer);
        addSubClass(tgc, XSD.NCName, XSD.xstring);
        addSubClass(tgc, XSD.token, XSD.xstring);
        addSubClass(tgc, XSD.ENTITY, XSD.xstring);
        addSubClass(tgc, XSD.ID, XSD.xstring);
        addSubClass(tgc, XSD.IDREF, XSD.xstring);
        addSubClass(tgc, XSD.NMTOKEN, XSD.xstring);
    }
    
    static void addSubClass(TransitiveGraphCache tgc, Resource sub, Resource sup) {
        tgc.addRelation( new Triple( sub.asNode(), RDFS.subClassOf.asNode(), sup.asNode()) );
    }
    
    public static boolean isSubTypeOf(Resource a, Resource b) {
        return tgc.contains( new TriplePattern(a.asNode(), RDFS.subClassOf.asNode(), b.asNode()) );
    }
    
    public static boolean isSubTypeOf(String aUri, String bUri) {
        return tgc.contains( new TriplePattern(Node.createURI(aUri), RDFS.subClassOf.asNode(), Node.createURI(bUri)) );
    }
}

