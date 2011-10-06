/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$
*/

/******************************************************************
    File:        TestEncoder.java
    Created by:  Dave Reynolds
    Created on:  23 Dec 2009
 * 
 * (c) Copyright 2011 Epimorphics Limited
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * $Id:  $
 *****************************************************************/

package com.epimorphics.jsonrdf;
import static com.epimorphics.jsonrdf.utils.ModelIOUtils.modelFromTurtle;
import static org.junit.Assert.*;

import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.junit.*;
import org.openjena.atlas.json.JsonArray;
import org.openjena.atlas.json.JsonException;
import org.openjena.atlas.json.JsonObject;

import com.epimorphics.jsonrdf.impl.EncoderDefault;
import com.epimorphics.jsonrdf.utils.ModelCompareUtils;
import com.epimorphics.jsonrdf.utils.ModelIOUtils;
import com.epimorphics.vocabs.API;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.rdf.model.Property;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.vocabulary.OWL;

public class TestEncoder {

    @Test public void testNullEncode() throws IOException {
        StringWriter writer = new StringWriter();
        Encoder.get( true ).encode(
                ModelFactory.createDefaultModel(), 
                new ArrayList<Resource>(), 
                writer);
        assertEquals("{\"format\":\"linked-data-api\",\"version\":\"0.2\",\"results\":[],\"context\":{\"mapping\":{}}}",
                writer.toString().replaceAll( "[ \n]+", "" ));
    }
    
    /**
     * Test that the encoding round trips
     * @param src  model to be encoded
     * @param ont optional ontology model describing encoding
     * @param expected model expected back, may be same as source
     * @param roots root resources to encode
     * @param show set to true to print encoding to console (dev only)
     * @return the encoded string for further testing
     * @throws JSONException
     * @throws IOException
     */
    public static String roundTripTester(Model src, Encoder enc, Model expected, List<Resource> roots) throws IOException {
        StringWriter writer = new StringWriter();
        if (roots == null) {
            enc.encode(src, writer);
        } else {
            enc.encode(src, roots, writer);
        }
        String written = writer.toString();
        // System.out.println( ">> wrote encoding:\n" + written );
		Reader reader = new StringReader( written );
        
        List<Resource> results = Decoder.decode(reader);
        if (roots != null) {
            assertTrue( results.size() >= roots.size());
            Iterator<Resource> i = results.iterator();
            for (Resource r : roots) {
                assertEquals(r, i.next());
            }
        }
        if ( ! results.isEmpty() ) {
            Model found = results.get(0).getModel();
            // assertIsoModels(expected, found);
            boolean ok = ModelCompareUtils.compareAndDisplayDifferences( expected, found );
            assertTrue( "models should be isomorphic", ok );
//            boolean ok = found.isIsomorphicWith(expected);
//            if (!ok) {
//                System.out.println("Found:");
//                found.write(System.out, "Turtle");
//                System.out.println("Expected:");
//                expected.write(System.out, "Turtle");
//                assertTrue("Compare returned model", ok);
//            }
        }
        return writer.toString();
    }
	
    public static String roundTripTester(String srcTTL, String expectedTTL, String[] roots) throws  IOException {
        Model src = modelFromTurtle(srcTTL);
        Model expected = modelFromTurtle(expectedTTL);
        List<Resource> rootsR = modelRoots(roots, src);
        return roundTripTester(src, Encoder.get(), expected, rootsR);
    }
    
    public static String roundTripTester(String srcTTL, String[] roots) throws IOException {
        Model src = modelFromTurtle(srcTTL);
        return roundTripTester(src, Encoder.get(), src, modelRoots(roots, src));
    }

    public static String roundTripOntTester(String srcTTL, String ontTTL, String[] roots) throws IOException {
        Model src = modelFromTurtle(srcTTL);
        Model ont = modelFromTurtle(ontTTL);
        return roundTripTester(src, Encoder.get(ont), src, modelRoots(roots, src));
    }

    public static String roundTripOntTester(String srcTTL, String ontTTL, String expectedTTL, String[] roots) throws IOException {
        Model src = modelFromTurtle(srcTTL);
        Model ont = modelFromTurtle(ontTTL);
        Model expected = modelFromTurtle(expectedTTL);
        return roundTripTester(src, Encoder.get(ont), expected, modelRoots(roots, src));
    }

    public static String roundTripEncTester(String srcTTL, Encoder enc, String[] roots) throws IOException {
        Model src = modelFromTurtle(srcTTL);
        return roundTripTester(src, enc, src, modelRoots(roots, src));
    }

    public static String roundTripTester(String srcTTL) throws IOException {
        return roundTripTester(srcTTL, null);
    }

    static List<Resource> modelRoots(String[] roots, Model src) {
        if (roots == null) return null;
        List<Resource> rootsR = new ArrayList<Resource>();
        for (String root : roots) {
            rootsR.add( src.createResource( src.expandPrefix(root) ) );
        }
        return rootsR;
    }
    
    public static String testEncoding(String srcTTL, String ontTTL,  String[] roots, String expectedEncoding) throws  IOException {
        Encoder enc = (ontTTL == null) ? Encoder.get() : Encoder.get( ModelIOUtils.modelFromTurtle(ontTTL) );
        return testEncoding(srcTTL, enc, roots, expectedEncoding);
    }
    
    public static String testEncoding(String srcTTL, Encoder enc,  String[] roots, String expectedEncoding) throws  IOException {
        return testEncoding(srcTTL, enc, srcTTL, roots, expectedEncoding);
    }

    public static String testEncoding(String srcTTL, Encoder enc,  String expectedTTL, String[] roots, String expectedEncoding) throws IOException {
        try {
            Model src = modelFromTurtle(srcTTL);
            Model expectedM = modelFromTurtle(expectedTTL);
            String encoding = roundTripTester(src, enc, expectedM, modelRoots(roots, src));
            JsonArray actual = parseJSON(encoding).get(EncoderDefault.PNContent).getAsArray();
            if (expectedEncoding == null) {
                System.out.println(actual);
            } else {
            	JsonArray expected = ParseWrapper.stringToJsonArray(expectedEncoding);
                assertEquals(expected, actual);
            }
            return encoding;
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
    }

    public static JsonObject parseJSON(String src) {
        try {
            return ParseWrapper.stringToJsonObject(src);
        } catch (JsonException e) {
            throw new EncodingException(e.getMessage(), e);
        }
    }
    
    @Test public void testSimpleResourceNoLabels() throws IOException {
        roundTripTester(":r :p 'foo'.",  new String[]{":r"} );
    }
    
    @Test public void testSimpleResourceClash() throws IOException {
        roundTripTester(":r :p 'foo'; alt:p 'bar'.", new String[]{":r"} );
    }
    
    @Test public void testRDFtype() throws IOException {
        roundTripTester(":r a :Thing; :p 'foo'.", new String[]{":r"} );
    }
    
    @Test public void testSimplebNode() throws IOException {
        roundTripTester(":r :p [:p 'first'; :q 'second'].", new String[]{":r"} );
    }
    
    @Test public void testMultiRefbNode() throws IOException {
        roundTripTester(":r :p _:1. :r2 :p _:1. _:1 :q 'foo'.", new String[]{":r", ":r2"} );
    }
    
    @Test public void testSimpleLiterals() throws IOException {
        roundTripTester(":r :p 'foo'; :p2 23; :p3 '1.2'^^xsd:double.",  new String[]{":r"} );
    }
    
    @Test public void testMultivalues() throws IOException {
        roundTripTester(":r :p 'foo' , 'bar' , 'baz' ; :p2 23 .",  new String[]{":r"} );
    }
    
    @Test public void testResourcesWithLabels() throws IOException {
        testEncoding(":r :p :res. :res rdfs:label 'resource label'.", Encoder.get(), ":r :p :res.",  new String[]{":r"},
        "[{'_about':'http://www.epimorphics.com/tools/example#r', 'p':'http://www.epimorphics.com/tools/example#res'}]");
    }
    
    @Test public void testSimpleLists() throws IOException {
        roundTripTester(":r :p ('1'^^xsd:int '2'^^xsd:int '2'^^xsd:int).",  new String[]{":r"} );
    }
    
    @Test public void testNestedLists() throws IOException {
        roundTripTester(":r :p ('1'^^xsd:int '2'^^xsd:int ('a' 'b')).",  new String[]{":r"} );
    }
    
    @Test public void testOntologyNaming() throws IOException {
        testEncoding(":r :p 'foo'; :q 'bar'.", ":p rdf:type rdf:Property; rdfs:label 'pee'.", new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r','pee':'foo','q':'bar'}]" );
    }
    
    @Test public void testForcedMultivalue() throws IOException {
        testEncoding(":r :p 'foo'; :q 'bar'.", ":p rdf:type api:Multivalued, rdf:Property.", new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r','p':['foo'],'q':'bar'}]" );
    }
    
    @Test public void testForcedMultivalue2() throws IOException {
        roundTripOntTester(":r :p 'foo'. :r2 :p 'foo', 'bar'.", ":p rdf:type api:Multivalued, rdf:Property.", new String[]{":r", ":r2"});
    }
    
    @Test public void testHide() throws IOException {
        roundTripOntTester(":r :p 'foo'; :q 'bar'.", ":p rdf:type api:Hidden, rdf:Property.", ":r :q 'bar'.", new String[]{":r"});
    }
    
    @Test public void testPropertyBase() throws IOException {
        testEncoding(":r :p 'foo'.", Encoder.get( new Context("http://www.epimorphics.com/tools/")), 
                new String[]{":r"}, "[{'_about':'<example#r>','p':'foo'}]");
    }
    
    @Test public void testResourceBase() throws IOException {
        testEncoding(":r :p :r2. :r2 :p :r3.", Encoder.get( new Context("http://www.epimorphics.com/tools/")), 
                new String[]{":r", ":r2"}, "[{'_about':'<example#r>','p':'<example#r2>'},{'_about':'<example#r2>','p':'<example#r3>'}]");
    }

    @Test public void testResourceList() throws IOException {
        roundTripEncTester(":r :p (:r1 :r2 :r3).", 
                Encoder.get( new Context("http://www.epimorphics.com/tools/")), 
                new String[]{":r"});
    }
    
    @Test public void testPropertySorting() throws IOException {
        Context context = new Context();
        context.setSorted(true);
        testEncoding(":r :p 'foo'; :q 'bar'; :s 'baz'.", Encoder.get( context ), 
                new String[]{":r"}, "[{'_about':'http://www.epimorphics.com/tools/example#r','p':'foo','q':'bar','s':'baz'}]");
    }
    
    // Objects of RDF.type used to get shortened. Now they should not be.
    @Test public void testTypesDontShorten() throws IOException {
        Context context = new Context();
        context.recordPreferredName( "T", "http://www.epimorphics.com/tools/example#t" );
        context.recordPreferredName( "U", "http://www.epimorphics.com/tools/example#u" );
        context.setSorted(true);
        testEncoding(":r rdf:type :t, :u.", Encoder.get( context ), 
                new String[]{":r"}, "[{'_about':'http://www.epimorphics.com/tools/example#r', 'type':['http://www.epimorphics.com/tools/example#t', 'http://www.epimorphics.com/tools/example#u']}]");
        }
    
    /*
        This is the no-language-tags version of the encoding. The older test is below.
     */
    @Test public void testLiterals() throws IOException {
        testEncoding(":r :p 'foo'; :q '2.3'^^xsd:float; :s 'bar'^^xsd:string.", 
                Encoder.get(),
                ":r :p 'foo'; :q '2.3'^^xsd:double; :s 'bar'.",
                new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r','q':2.3,'p':'foo','s':'bar'}]" );
        testEncoding(":r :p 'true'^^xsd:boolean.", 
                Encoder.get(),
                new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r','p':true}]" );
        testEncoding(":r :p 'http://example.com/eg'^^xsd:anyURI.", 
                Encoder.get(),
                new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r','p':'http://example.com/eg'}]");                
        // Problem with Jena datatype equality blocks testing
        // If we weren't using Maven this would be easy to fix. Sigh.
//        testEncoding(":r :p 'foobar'^^alt:mytype.", 
//                Encoder.get(),
//                new String[]{":r"}, 
//                null);
    }
    
//    @Test public void testLiterals() throws IOException {
//        testEncoding(":r :p 'foo'@en; :q '2.3'^^xsd:float; :s 'bar'^^xsd:string.", 
//                Encoder.get(),
//                ":r :p 'foo'@en; :q '2.3'^^xsd:double; :s 'bar'.",
//                new String[]{":r"}, 
//                "[{'_about':'http://www.epimorphics.com/tools/example#r','q':2.3,'p':'foo@en','s':'bar'}]" );
//        testEncoding(":r :p 'true'^^xsd:boolean.", 
//                Encoder.get(),
//                new String[]{":r"}, 
//                "[{'_about':'http://www.epimorphics.com/tools/example#r','p':true}]" );
//        testEncoding(":r :p 'http://example.com/eg'^^xsd:anyURI.", 
//                Encoder.get(),
//                new String[]{":r"}, 
//                "[{'_about':'http://www.epimorphics.com/tools/example#r','p':'http://example.com/eg'}]");                
//        // Problem with Jena datatype equality blocks testing
//        // If we weren't using Maven this would be easy to fix. Sigh.
////        testEncoding(":r :p 'foobar'^^alt:mytype.", 
////                Encoder.get(),
////                new String[]{":r"}, 
////                null);
//    }
    
    static final String somePrefixes = 
    	"@prefix api: <" + API.getURI() + ">.\n"
    	+ "@prefix owl: <" + OWL.getURI() + ">.\n"
    	;
    
    @Test public void testStructuredLiteralWithLanguage() throws IOException {
    	testEncoding( 
    		":r :p 'english'@en.", 
            encoderForStructuredLiterals(),
            ":r :p 'english'@en.",
            new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r','p': { '_value': 'english', '_lang': 'en'}}]" );
    }
    
    @Test public void testStructuredLiteralWithType() throws IOException {
    	testEncoding( 
    		":r :p 'english'^^xsd:string.", 
            encoderForStructuredLiterals(),
            ":r :p 'english'^^xsd:string.",
            new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r','p': { '_value': 'english', '_datatype': 'string'}}]" );
    }

	private Encoder encoderForStructuredLiterals() {
		Model ontology = ModelIOUtils.modelFromTurtle( ":p a owl:DatatypeProperty; api:structured true. xsd:string a rdfs:Class." );
    	return Encoder.get( Encoder.defaultPlugin, new Context(ontology) );
	}

    @Test public void testDateLiterals() throws IOException {
        testEncoding(":r :p '1999-05-31T02:09:32Z'^^xsd:dateTime.", 
                Encoder.get(),
                new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r','p':'Mon, 31 May 1999 02:09:32 GMT+0000'}]" );
    }
    
    @Test public void testWholeModels() throws IOException, JsonException {
        roundTripTester(":r :p 'foo', 'bar'.");
        roundTripTester(":r :p 'foo', 'bar'. :r2 :q :r.");
        roundTripTester(":r :p 'foo', 'bar'; :q [:s 'baz'].");
        roundTripTester(":r :p 'foo', 'bar'. [] :s 'baz'.");
    }
    
    @Test public void testOddResourceURIs() throws IOException {
        Model model = ModelFactory.createDefaultModel();
        String NS = "/foo/bar";
        Property p = model.createProperty(NS + "#p");
        model.createResource(NS + "#r").addProperty(p, "value");
        roundTripTester(model, Encoder.get(), model, null);
        // While this round trips the encoding includes a \ escape inserted
        // by the JSON writer ("</foo" becomes "<\/foo" to allow insertion into HTML
        // However, such URIs are broken anyway so accept this encoding for now.
    }
    
    @Test public void testRecursiveEncoding1() throws IOException {
        testRecursiveRoundTrip(
                ":r :p :r1. :r1 :p :r2. :r2 :p :r1; :s 'foo'.",
                ":r :p :r1. :r1 :p :r2. :r2 :p :r1; :s 'foo'.",
                new String[]{":r"} );
    }

    @Test public void testRecursiveEncoding2() throws IOException {
        testRecursiveRoundTrip(
                ":r :p :r1. :r1 :p :r2. :r2 :p :r1; :s 'foo'. :r3 :p 'bar'.",
                ":r :p :r1. :r1 :p :r2. :r2 :p :r1; :s 'foo'.",
                new String[]{":r"} );
    }

    void testRecursiveRoundTrip(String srcTTL, String expectedTTL, String[] roots) {
        Model src = modelFromTurtle(srcTTL);
        Model expected = modelFromTurtle(expectedTTL);
        List<Resource> rootsR = modelRoots(roots, src);
        
        StringWriter writer = new StringWriter();
        Encoder.get().encodeRecursive(src, rootsR, writer);
        StringReader reader = new StringReader( writer.toString() );
        List<Resource> results = Decoder.decode(reader);
        assertNotNull(results);
        assertFalse(results.isEmpty());
        Model found = results.get(0).getModel();
//        assertIsoModels(expected, found);
        boolean ok = ModelCompareUtils.compareAndDisplayDifferences( expected, found );
        assertTrue("Compare returned model", ok);        
    }
    
}

