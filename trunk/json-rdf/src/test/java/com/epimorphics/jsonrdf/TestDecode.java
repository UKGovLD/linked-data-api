/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$
*/

/******************************************************************
    File:        TestDecode.java
    Created by:  Dave Reynolds
    Created on:  22 Feb 2010
 * 
 * (c) Copyright 2010, Epimorphics Limited
 * $Id:  $
 *****************************************************************/

package com.epimorphics.jsonrdf;

import java.io.StringReader;
import java.util.List;

import org.junit.Test;
import static org.junit.Assert.*;

import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.util.FileManager;

/**
 * Tests for decoding raw JSON serializations.
 * Most decoder testing is done in the round trip testing.
 * The tests here just cover examples where context-free JSON
 * is assembled manually.
 * 
 * @author <a href="mailto:dave@epimorphics.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class TestDecode {

    static Context context = new Context( FileManager.get().loadModel("src/test/resources/apicontext.ttl") );

    @Test
    public void testRawDecode() {
        decodeTest( 
                "{'results':[{'_about':'http://www.epimorphics.com/apis/sch'," +
        		"'type':'API'," +
        		"'label':'name'," +
        		"'description':'longer description'," +
        		"'sparqlEndpoint':'http://services.data.gov.uk/education/sparql'," +
        		"'endpoint':{'_about':'http://www.epimorphics.com/endpoints/sch','type':'ListEndpoint','uriTemplate':'sch','selector':{}}}]}"
        		);
    }
    
    public void decodeTest(String src) {
        StringReader reader = new StringReader(src);
        List<Resource> results = Decoder.decode(context, reader);
        assertFalse( results.isEmpty() );
        Model decoded = results.get(0).getModel();
        assertTrue( checkModel(decoded, "src/test/resources/rawdecode1.ttl") );
    }
    
    public boolean checkModel(Model actual, String expectedFile) {
        Model expected = FileManager.get().loadModel(expectedFile);
        if ( ! expected.isIsomorphicWith(actual)) {
            System.out.println("Model check failed, found:");
            actual.write(System.out, "Turtle");
            return false;
        } else {
            return true;
        }
    }
    
}

