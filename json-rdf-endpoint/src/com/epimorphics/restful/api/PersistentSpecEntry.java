/*
	(c) Copyright 2010 Epimorphics Limited
	[see end of file]
	$Id$
*/

package com.epimorphics.restful.api;

import java.io.*;

import javax.jdo.annotations.*;

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;

@PersistenceCapable(identityType = IdentityType.APPLICATION) class PersistentSpecEntry
    {
    @Persistent protected String uri;
    @Persistent protected String userKey;
    @Persistent protected byte [] keyDigest;
    @Persistent protected String modelAsNTriples;
    
    @PrimaryKey @Persistent(valueStrategy = IdGeneratorStrategy.IDENTITY) protected Key key;
    
    PersistentSpecEntry( String uri, String userKey, Model model )
        {
        this.uri = uri;
        this.userKey = userKey;
        this.keyDigest = SpecUtils.digestKey( uri, userKey );
        this.modelAsNTriples = asNTriples( model );
        this.key = KeyFactory.createKey( PersistentSpecEntry.class.getSimpleName(), SpecManagerGAE.SPEC_KEY + "/" + uri );
        }
    
    private static String asNTriples( Model model )
        {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        model.write( bos, "N-TRIPLES" );
        return bos.toString();
        }
    
    public Model getModel()
        {
        try
            {
            InputStream in = new ByteArrayInputStream( modelAsNTriples.getBytes( "UTF-8" ) );
            Model result = ModelFactory.createDefaultModel();
            result.read( in, "N-TRIPLES" );
            return result;
            }
        catch (UnsupportedEncodingException e)
            { throw new RuntimeException( e ); }
        }
    }
    
/*
    (c) Copyright 2010 Epimorphics Limited
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

    1. Redistributions of source code must retain the above copyright
       notice, this list of conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above copyright
       notice, this list of conditions and the following disclaimer in the
       documentation and/or other materials provided with the distribution.

    3. The name of the author may not be used to endorse or promote products
       derived from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
    IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
    IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
    INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
    NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
    THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
