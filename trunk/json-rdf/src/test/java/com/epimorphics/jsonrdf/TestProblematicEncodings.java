/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$
*/

/******************************************************************
    File:        TestProblematicEncodings.java
    Created by:  Dave Reynolds
    Created on:  4 Feb 2010
 * 
 * (c) Copyright 2010, Epimorphics Limited
 * $Id:  $
 *****************************************************************/

package com.epimorphics.jsonrdf;

import static com.epimorphics.jsonrdf.TestEncoder.testEncoding;

import java.io.IOException;

import org.junit.Test;
/**
 * Collection of cases that didn't work at first.
 * 
 * @author <a href="mailto:dave@epimorphics.com">Dave Reynolds</a>
 * @version $Revision: $
 */
public class TestProblematicEncodings {

    @Test
    public void testNameClash1() throws IOException {
        String srcTTL = ":school a :Shool; alt:type 'Primary'.";
        String[] roots = new String[]{":school"};
        String expectedEncoding = "[{'alt_type':'Primary','type':'http://www.epimorphics.com/tools/example#Shool','_about':'http://www.epimorphics.com/tools/example#school'}]";
        Encoder enc = Encoder.get();
        testEncoding(srcTTL, enc, roots, expectedEncoding);
    }
    
    @Test
    public void testNullLists() throws IOException {
        testEncoding(":r :p [] .", 
                Encoder.get(),
                new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r','p':{}}]" );
        testEncoding(":r :p () .", 
                Encoder.get(),
                new String[]{":r"}, 
                "[{'_about':'http://www.epimorphics.com/tools/example#r','p':[]}]" );
    }
    
}

