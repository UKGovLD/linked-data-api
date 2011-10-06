/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$
*/

/******************************************************************
    File:        TestStringBashing.java
    Created by:  Dave Reynolds
    Created on:  29 Dec 2009
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

import org.junit.Ignore;
import org.junit.Test;

import com.epimorphics.jsonrdf.impl.EncoderDefault;

import static org.junit.Assert.*;

public class TestStringBashing {

    @Test @Ignore public void testEncode() {
        doTestEncode("foo bar", "foo bar");
        doTestEncode("foo^^bar", "foo\\^\\^bar");
        doTestEncode("foo\\bar", "foo\\\\bar");
        doTestEncode("/foo/bar", "/foo/bar");
        doTestEncode("http://foo/bar", "http://foo/bar");
    }
    
    private void doTestEncode(String src, String expected) {
        String actual = EncoderDefault.escapeString(src);
        assertEquals(expected, actual);
        assertEquals(src, EncoderDefault.unescapeString(actual));
    }
    
    @Test public void testURIs() {
        assertEquals(true, RDFUtil.looksLikeURI("http://www.foo.bar/baz"));
        assertEquals(true, RDFUtil.looksLikeURI("https://www.foo.bar/baz"));
        assertEquals(true, RDFUtil.looksLikeURI("mailto:dave@epimorphics.com"));
        assertEquals(true, RDFUtil.looksLikeURI("file://c:\\mydrive/foo.bar"));
        assertEquals(true, RDFUtil.looksLikeURI("urn:isbn:12345908"));
        assertEquals(false, RDFUtil.looksLikeURI("foo:baz"));
        assertEquals(false, RDFUtil.looksLikeURI("http//fool"));
    }
}

