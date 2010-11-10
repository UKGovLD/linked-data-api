<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="result.xsl" />

<xsl:template match="primaryTopic" mode="moreinfo">
	<xsl:if test="starts-with(@href, 'http://transport.data.gov.uk/id/road/')">
		<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
		<ul>
			<li><a href="{$base}/traffic-count-point">Points on the <xsl:apply-templates select="." mode="name" /></a></li>
		</ul>
	</xsl:if>
</xsl:template>

<xsl:template match="value" mode="showBarchart">false</xsl:template>
<xsl:template match="value" mode="showBoxplot">false</xsl:template>

</xsl:stylesheet>