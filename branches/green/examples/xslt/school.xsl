<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="result.xsl" />

<xsl:template match="establishmentNumber | uniqueReferenceNumber" mode="showBarchart">false</xsl:template>
<xsl:template match="establishmentNumber | uniqueReferenceNumber" mode="showBoxplot">false</xsl:template>

<xsl:template match="isPartOf" mode="moreinfo">
	<xsl:variable name="base" select="substring-after(@href, 'http://education.data.gov.uk')" />
	<xsl:variable name="path" select="substring-before(concat($base, '?'), '?')" />
	<xsl:call-template name="educationLinks">
		<xsl:with-param name="base" select="$path" />
	</xsl:call-template>
</xsl:template>

<xsl:template match="primaryTopic" mode="moreinfo">
	<xsl:call-template name="educationLinks">
		<xsl:with-param name="base">
			<xsl:choose>
				<xsl:when test="starts-with(@href, 'http://education.data.gov.uk/id/')">
					<xsl:value-of select="concat('/doc/', substring-after(@href, '/id/'))"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="substring-after(@href, 'http://education.data.gov.uk')"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:with-param> 
	</xsl:call-template>
</xsl:template>

<xsl:template name="educationLinks">
	<xsl:param name="base" />
	<xsl:choose>
		<xsl:when test="starts-with($base, '/doc/school/census/')">
			<xsl:variable name="census">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'census'" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:variable name="school" select="concat('/doc/school/', substring-after($base, '/school/census/'))" />
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Census</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$school" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">School</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/doc/school/') and string(number(substring-after($base, '/doc/school/'))) != 'NaN'">
			<xsl:variable name="school">
				<xsl:call-template name="subPath">
					<xsl:with-param name="uri" select="$base" />
					<xsl:with-param name="component" select="'school'" />
				</xsl:call-template>
			</xsl:variable>
			<xsl:variable name="census" select="concat('/doc/school/census/', substring-after($base, '/school/'))" />
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$census" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Census</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="$school" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">School</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
	</xsl:choose>
	<xsl:choose>
		<xsl:when test="starts-with($base, '/doc/')">
			<ul>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/school/phase/secondary'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Secondary schools</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/school/phase/primary'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">Primary schools</xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="moreinfoLink">
					<xsl:with-param name="uri" select="'/doc/school'" />
					<xsl:with-param name="current" select="$base" />
					<xsl:with-param name="label">All schools</xsl:with-param>
				</xsl:call-template>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with($base, '/def/') and (type/item/@href = 'http://www.w3.org/2000/01/rdf-schema#Class' or type/item/@href = 'http://www.w3.org/2002/07/owl#Class')">
			<ul>
				<li><a href="{$base}/property">Properties</a></li>
				<li><a href="{$base}/instance">Instances</a></li>
				<li><a href="{$base}/subclass">Subclasses</a></li>
			</ul>
		</xsl:when>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>