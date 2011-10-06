/*
	See lda-top/LICENCE (or http://elda.googlecode.com/hg/LICENCE)
    for the licence for this software.
    
    (c) Copyright 2011 Epimorphics Limited
    $Id$
*/
package com.epimorphics.jsonrdf.extras;

import static org.openjena.atlas.lib.Chars.CH_QUOTE1 ;
import static org.openjena.atlas.lib.Chars.CH_QUOTE2 ;

import java.io.OutputStream ;
import java.io.Writer;
import java.util.Stack ;

import org.openjena.atlas.json.JsonException;
import org.openjena.atlas.lib.BitsInt ;


/** 
 	A low level streaming JSON writer - assumes correct sequence of calls 
 	(e.g. keys in objects). Useful when writing JSON directly from some 
 	other structure.
 	
 	 Derived from JsonWriter to allow initialisation with a Writer
 	 and direct output of literals. This version checks that array and
 	 object brackets match and that only a single value appears at top level.
*/

public class JSStreamingWriter {
	
    private IndentedWriter out = IndentedWriter.stdout ;
    
    public JSStreamingWriter() { this(IndentedWriter.stdout) ; }
    public JSStreamingWriter(Writer w) { this(new IndentedWriter(w)) ; }
    public JSStreamingWriter(OutputStream ps) { this(new IndentedWriter(ps)) ; }
    public JSStreamingWriter(IndentedWriter ps) { out = ps ; }
    
    public void startOutput() { /* */ }
    public void finishOutput() { out.flush(); } 
    
    // Remember whether we are in the first element of a compound (object or array). 
    // Stack<Ref<Boolean>> stack = new Stack<Ref<Boolean>>() ;
    
    // remember the construct we are currently in.
    
    Stack<String> openerStack = new Stack<String>();
    
    boolean needsComma = false;
    
    public void startObject()
    {
        startCompound( "{" ) ;
        out.incIndent() ;
    }
    
    public void finishObject()
    {
        out.decIndent() ;
        finishCompound( "{", "}\n" ) ;
    }
    
    public void key(String key)
    {
        value(key) ;
        out.print(" : ") ;
        needsComma = false;
    }

    public void startArray()
    {
        startCompound( "[" ) ;
    }
    
    public void finishArray()
    {
        finishCompound( "[", "]" ) ;
    }
  
    public static String outputQuotedString(String string)
    {
        IndentedLineBuffer b = new IndentedLineBuffer() ;
        outputQuotedString(b, string) ;
        return b.asString() ;
    }
    
    static private boolean writeJavaScript = false ;
    
    /* \"  \\ \/ \b \f \n \r \t
     * control characters (def?) 
     * \ u four-hex-digits (if
     *  you don't know why the comment writes "\ u", 
     *  and not without space then ... */
    public static void outputQuotedString(IndentedWriter out, String string)
    { 
        final boolean allowBareWords = writeJavaScript ;
        
        char quoteChar = CH_QUOTE2 ;
        int len = string.length() ;
        
        if ( allowBareWords )
        {
            boolean safeBareWord = true ;
            if ( len != 0 )
                safeBareWord = isA2Z(string.charAt(0)) ;

            if ( safeBareWord )
            {
                for (int i = 1; i < len; i++)
                {
                    char ch = string.charAt(i);
                    if ( isA2ZN(ch) ) continue ;
                    safeBareWord = false ;
                    break ;
                }
            }
            if ( safeBareWord )
            {
                // It's safe as a bare word in JavaScript.
                out.print(string) ;
                return ;
            }
        }

        if ( allowBareWords )
            quoteChar = CH_QUOTE1 ;
        
        out.print(quoteChar) ;
        for (int i = 0; i < len; i++)
        {
            char ch = string.charAt(i);
            if ( ch == quoteChar )
            {
                esc(out, quoteChar) ;
                continue ;
            }
            
            switch (ch)
            {
                case '"':   esc(out, '"') ; break ;
//                case '\'':   esc(out, '\'') ; break ;
                case '\\':  esc(out, '\\') ; break ;
                case '/':
                    // Avoid </ which confuses if it's in HTML (this is from json.org)
                    if ( i > 0 && string.charAt(i-1) == '<' )
                        esc(out, '/') ;
                    else
                        out.print(ch) ;
                    break ;
                case '\b':  esc(out, 'b') ; break ;
                case '\f':  esc(out, 'f') ; break ;
                case '\n':  esc(out, 'n') ; break ;
                case '\r':  esc(out, 'r') ; break ;
                case '\t':  esc(out, 't') ; break ;
                default:
                    
                    //Character.isISOControl(ch) ; //00-1F, 7F-9F
                    // This is more than Character.isISOControl
                    
                    if (ch < ' ' || 
                        (ch >= '\u007F' && ch <= '\u009F') ||
                        (ch >= '\u2000' && ch < '\u2100'))
                    {
                        out.print("\\u") ;
                        int x = ch ;
                        x = oneHex(out, x, 3) ;
                        x = oneHex(out, x, 2) ;
                        x = oneHex(out, x, 1) ;
                        x = oneHex(out, x, 0) ;
                        break ;
                    }
                        
                    out.print(ch) ;
                    break ;
            }
        }
        out.print(quoteChar) ;
    }
    
   
    private void startCompound( String opener )    
    	{ 
    	comma();
    	out.print( opener );
    	openerStack.push( opener );
    	needsComma = false;
    	}
    
    private void finishCompound( String opener, String closer )  
    	{
    	if (openerStack.isEmpty()) 
    		throw new JsonException("cannot finish with '" + closer + "' at top level." );
    	String x = openerStack.pop();
    	if (!x.equals(opener)) 
    		throw new JsonException( "cannot finish with '" + closer + "' inside '" + x + "'." );
    	out.print( closer );
    	needsComma = true;
    	}
    
    private void comma()
    	{
    	if (needsComma) 
    		{
    		if (openerStack.isEmpty())
    			throw new JsonException( "cannot have more than one element at top-level." );
    		out.print( ", " );
    		}
    	needsComma = true;
    	}
    
    public void value(String x) 
    	{
    	comma();
    	if (x.contains("\\@")) throw new RuntimeException( "detected \\@ in " + x );
    	// out.print("\"") ; out.print(x) ; out.print("\"") ; 
    	outputQuotedString(out, x);
    	}
    
    public void value(boolean b) 
    	{ 
    	comma();
    	out.print(Boolean.toString(b)) ;
    	}
    
    public void value(double d) 
    	{ 
    	comma();
    	out.print(Double.toString(d)) ; 
    	}
    
    public void value(long integer) 
    	{
    	comma();
    	out.print(Long.toString(integer)) ; 
    	}

    // Library-ize.
    
    private static boolean isA2Z(int ch)
    {
        return range(ch, 'a', 'z') || range(ch, 'A', 'Z') ;
    }

    private static boolean isA2ZN(int ch)
    {
        return range(ch, 'a', 'z') || range(ch, 'A', 'Z') || range(ch, '0', '9') ;
    }
    
    private static boolean range(int ch, char a, char b)
    {
        return ( ch >= a && ch <= b ) ;
    }
    
    private static void esc(IndentedWriter out, char ch)
    {
        out.print('\\') ; out.print(ch) ; 
    }
    
    private static int oneHex(IndentedWriter out, int x, int i)
    {
        int y = BitsInt.unpack(x, 4*i, 4*i+4) ;
        char charHex = org.openjena.atlas.lib.Chars.hexDigitsLC[y] ;
        out.print(charHex) ; 
        return BitsInt.clear(x, 4*i, 4*i+4) ;
    }
    

}
