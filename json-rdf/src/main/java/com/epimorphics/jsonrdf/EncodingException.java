/*
    See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$

    File:        EncodingException.java
    Created by:  Dave Reynolds
    Created on:  21 Dec 2009
*/

package com.epimorphics.jsonrdf;

/** Return problems found during JSON encode/decode */

public class EncodingException extends RuntimeException {

    private static final long serialVersionUID = 1L;
    
    public EncodingException(String message) {
        super(message);
    }
    
    public EncodingException(String message, Throwable t) {
        super(message, t);
    }

}

