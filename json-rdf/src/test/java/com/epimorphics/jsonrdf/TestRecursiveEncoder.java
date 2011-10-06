/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$
*/

/******************************************************************
    File:        TestRecursiveEncoder.java
    Created by:  Dave Reynolds
    Created on:  3 Feb 2010
 * 
 * (c) Copyright 2010, Epimorphics Limited
 * $Id:  $
 *****************************************************************/

package com.epimorphics.jsonrdf;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.Iterator;
import java.util.List;

import org.junit.Test;
import org.openjena.atlas.json.JsonArray;
import org.openjena.atlas.json.JsonException;

import com.epimorphics.jsonrdf.impl.EncoderDefault;
import com.epimorphics.jsonrdf.utils.ModelIOUtils;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.Resource;

import static com.epimorphics.jsonrdf.TestEncoder.*;

public class TestRecursiveEncoder {
    
    public static String testRecursiveEncoding(String srcTTL,  String[] roots, String expectedEncoding, String baseUri) throws IOException {
        try {
            Model src = ModelIOUtils.modelFromTurtle(srcTTL);
            StringWriter writer = new StringWriter();
            List<Resource> rootsR = modelRoots(roots, src);
            Context context = new Context();
            if (baseUri != null) 
                context.setBase(baseUri);
            Encoder.get(context).encodeRecursive(src, rootsR, writer);
            String encoding = writer.toString();
            
            JsonArray actual = parseJSON(encoding).get(EncoderDefault.PNContent).getAsArray();
            if (expectedEncoding == null) {
                System.out.println(actual);
            } else {
                JsonArray expected = ParseWrapper.stringToJsonArray(expectedEncoding);
                assertEquals(expected, actual);
            }
            
            StringReader reader = new StringReader( encoding );
            List<Resource> results = Decoder.decode(reader);
            if (roots != null) {
                assertTrue( results.size() >= rootsR.size());
                Iterator<Resource> i = results.iterator();
                for (Resource r : rootsR) {
                    assertEquals(r, i.next());
                }
            }
            if ( ! results.isEmpty() ) {
                Model found = results.get(0).getModel();
                boolean ok = found.isIsomorphicWith(src);
                if (!ok) {
                    found.write(System.out, "Turtle");
//                    System.out.println("Found:");
//                    found.write(System.out, "N-TRIPLE");
//                    System.out.println("Expected:");
//                    expected.write(System.out, "N-TRIPLE");
                    assertTrue("Compare returned model", ok);
                }
            }
            
            
            return encoding;
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
    }
    
    @Test
    public void testSimpleNesting() throws IOException {
        testRecursiveEncoding(":r :p (:r1 :r2). :r1 :q :r3. :r2 :q :r3.", new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r'," +
                " 'p':[" +
                "   {'q':'http://www.epimorphics.com/tools/example#r3','_about':'http://www.epimorphics.com/tools/example#r1'}," +
                "   {'q':'http://www.epimorphics.com/tools/example#r3','_about':'http://www.epimorphics.com/tools/example#r2'}" +
                "]}]", null );

        testRecursiveEncoding(":r :p (:r1 :r2). :r1 :q :r3. :r2 :q :r3.", new String[]{":r"}, 
                "[{'_about':'<r>'," +
                " 'p':[" +
                "   {'q':'<r3>','_about':'<r1>'}," +
                "   {'q':'<r3>','_about':'<r2>'}" +
                "]}]", "http://www.epimorphics.com/tools/example#" );
    }
}

