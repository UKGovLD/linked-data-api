<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	version="1.0">
	
<xsl:import href="linked-data-api.xsl" />
	
<xsl:output method="text" media-type="text/csv" />
	
<xsl:template match="/">
	<xsl:apply-templates select="result" />
</xsl:template>

<xsl:template match="result">
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="label" select="key('propertyTerms', $label-uri)/label" />
	<xsl:variable name="prefLabel" select="key('propertyTerms', $prefLabel-uri)/label" />
	<xsl:variable name="altLabel" select="key('propertyTerms', $altLabel-uri)/label" />
	<xsl:variable name="name" select="key('propertyTerms', $name-uri)/label" />
	<xsl:variable name="title" select="key('propertyTerms', $title-uri)/label" />
	<xsl:variable name="properties">
		<xsl:text>@href,</xsl:text>
		<xsl:for-each select="(items/item/* | primaryTopic[not(../items)]/*)[generate-id(key('properties', name(.))[1]) = generate-id(.)]">
			<xsl:sort select="name(.) = $prefLabel" order="descending" />
			<xsl:sort select="name(.) = $name" order="descending" />
			<xsl:sort select="name(.) = $title" order="descending" />
			<xsl:sort select="name(.) = $label" order="descending" />
			<xsl:sort select="name(.) = $altLabel" order="descending" />
			<xsl:sort select="name(.) = $easting" order="descending" />
			<xsl:sort select="name(.) = $northing" order="descending" />
			<xsl:sort select="name(.) = $lat" order="descending" />
			<xsl:sort select="name(.) = $long" order="descending" />
			<xsl:sort select="boolean(@datatype)" order="descending" />
			<xsl:sort select="@datatype" />
			<xsl:sort select="boolean(@href)" />
			<xsl:sort select="local-name()" />
			<xsl:apply-templates select="." mode="properties" />
		</xsl:for-each>
	</xsl:variable>
	<xsl:call-template name="headers">
		<xsl:with-param name="properties" select="$properties" />
	</xsl:call-template>
	<xsl:text>&#xA;</xsl:text>
	<xsl:for-each select="items/item | primaryTopic[not(../items)]">
		<xsl:apply-templates select="." mode="row">
			<xsl:with-param name="properties" select="$properties" />
		</xsl:apply-templates>
		<xsl:text>&#xA;</xsl:text>
	</xsl:for-each>
</xsl:template>

<xsl:template match="*" mode="properties">
	<xsl:param name="parentName" select="''" />
	<xsl:variable name="northing" select="key('propertyTerms', $northing-uri)/label" />
	<xsl:variable name="easting" select="key('propertyTerms', $easting-uri)/label" />
	<xsl:variable name="lat" select="key('propertyTerms', $lat-uri)/label" />
	<xsl:variable name="long" select="key('propertyTerms', $long-uri)/label" />
	<xsl:variable name="propertyName">
		<xsl:if test="$parentName != ''">
			<xsl:value-of select="$parentName" />
			<xsl:text>.</xsl:text>
		</xsl:if>
		<xsl:value-of select="name(.)" />
	</xsl:variable>
	<xsl:variable name="hasNonLabelProperties">
		<xsl:apply-templates select="." mode="hasNonLabelProperties" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$hasNonLabelProperties = 'true'">
			<xsl:for-each select="key('properties', $propertyName)/*[name() != 'item' and generate-id(key('properties', concat($propertyName, '.', name(.)))[1]) = generate-id(.)] |
				key('properties', concat($propertyName, '.item'))/*[generate-id(key('properties', concat($propertyName, '.item.', name(.)))[1]) = generate-id(.)]">
				<xsl:sort select="name(.) = $easting" order="descending" />
				<xsl:sort select="name(.) = $northing" order="descending" />
				<xsl:sort select="name(.) = $lat" order="descending" />
				<xsl:sort select="name(.) = $long" order="descending" />
				<xsl:sort select="boolean(@datatype)" order="descending" />
				<xsl:sort select="@datatype" />
				<xsl:sort select="boolean(@href)" />
				<xsl:sort select="local-name()" />
				<xsl:if test="@href or item/@href">
					<xsl:value-of select="$propertyName" />
					<xsl:text>.@href,</xsl:text>
				</xsl:if>
				<xsl:apply-templates select="." mode="properties">
					<xsl:with-param name="parentName" select="$propertyName" />
				</xsl:apply-templates>
			</xsl:for-each>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$propertyName" />
			<xsl:text>,</xsl:text>
			<xsl:if test="@href">
				<xsl:value-of select="$propertyName" />
				<xsl:text>.@href,</xsl:text>
			</xsl:if>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="headers">
	<xsl:param name="properties" />
	<xsl:variable name="property" select="substring-before($properties, ',')" />
	<xsl:text>"</xsl:text>
	<xsl:call-template name="contextPath">
		<xsl:with-param name="property" select="$property" />
	</xsl:call-template>
	<xsl:text>"</xsl:text>
	<xsl:if test="substring-after($properties, ',') != ''">
		<xsl:text>,</xsl:text>
		<xsl:call-template name="headers">
			<xsl:with-param name="properties" select="substring-after($properties, ',')" />
		</xsl:call-template>
	</xsl:if>
</xsl:template>

<xsl:template name="contextPath">
	<xsl:param name="property" />
	<xsl:choose>
		<xsl:when test="contains($property, '.')">
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="substring-before($property, '.')" />
			</xsl:call-template>
			<xsl:text> > </xsl:text>
			<xsl:call-template name="contextPath">
				<xsl:with-param name="property" select="substring-after($property, '.')" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="$property = '@href'">uri</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="$property" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="item | primaryTopic" mode="row">
	<xsl:param name="properties" />
	<xsl:param name="remaining" select="$properties" />
	<xsl:param name="number" select="1" />
	<xsl:param name="count">
		<xsl:for-each select="*">
			<xsl:sort select="count(item)" data-type="number" order="descending" />
			<xsl:if test="position() = 1">
				<xsl:value-of select="count(item)" />
			</xsl:if>
		</xsl:for-each>
	</xsl:param>
	<xsl:variable name="property" select="substring-before($remaining, ',')" />
	<xsl:apply-templates select="." mode="quotedValue">
		<xsl:with-param name="property" select="$property" />
		<xsl:with-param name="number" select="$number" />
	</xsl:apply-templates>
	<xsl:choose>
		<xsl:when test="substring-after($remaining, ',') != ''">
			<xsl:text>,</xsl:text>
			<xsl:apply-templates select="." mode="row">
				<xsl:with-param name="properties" select="$properties" />
				<xsl:with-param name="remaining" select="substring-after($remaining, ',')" />
				<xsl:with-param name="number" select="$number" />
				<xsl:with-param name="count" select="$count" />
			</xsl:apply-templates>
		</xsl:when>
		<xsl:when test="$number &lt; $count">
			<xsl:text>&#xA;</xsl:text>
			<xsl:apply-templates select="." mode="row">
				<xsl:with-param name="properties" select="$properties" />
				<xsl:with-param name="remaining" select="$properties" />
				<xsl:with-param name="number" select="$number + 1" />
				<xsl:with-param name="count" select="$count" />
			</xsl:apply-templates>
		</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="quotedValue">
	<xsl:param name="property" />
	<xsl:param name="number" select="0" />
	<xsl:variable name="value">
		<xsl:apply-templates select="." mode="value">
			<xsl:with-param name="property" select="$property" />
			<xsl:with-param name="number" select="$number" />
		</xsl:apply-templates>
	</xsl:variable>
	<xsl:if test="$value != ''">
		<xsl:text>"</xsl:text>
		<xsl:value-of select="$value" />
		<xsl:text>"</xsl:text>
	</xsl:if>
</xsl:template>

<xsl:template match="*" mode="value">
	<xsl:param name="property" />
	<xsl:param name="number" select="0" />
	<xsl:choose>
		<xsl:when test="contains($property, '.')">
			<xsl:variable name="propertyElement" select="*[name(.) = substring-before($property, '.')]" />
			<xsl:choose>
				<xsl:when test="not($propertyElement/item)">
					<xsl:apply-templates select="$propertyElement" mode="value">
						<xsl:with-param name="property" select="substring-after($property, '.')" />
					</xsl:apply-templates>
				</xsl:when>
				<xsl:when test="$number = 0">
					<xsl:for-each select="$propertyElement/item">
						<xsl:apply-templates select="." mode="value">
							<xsl:with-param name="property" select="substring-after($property, '.')" />
						</xsl:apply-templates>
						<xsl:if test="position() != last()"> ; </xsl:if>
					</xsl:for-each>
				</xsl:when>
				<xsl:when test="count($propertyElement/item) >= $number">
					<xsl:apply-templates select="$propertyElement/item[position() = $number]" mode="value">
						<xsl:with-param name="property" select="substring-after($property, '.')" />
					</xsl:apply-templates>
				</xsl:when>
				<xsl:otherwise>
					<xsl:apply-templates select="$propertyElement/item[1]" mode="value">
						<xsl:with-param name="property" select="substring-after($property, '.')" />
					</xsl:apply-templates>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:when test="$property = '@href'">
			<xsl:choose>
				<xsl:when test="not(item)">
					<xsl:value-of select="@href" />
				</xsl:when>
				<xsl:when test="$number = 0">
					<xsl:for-each select="item/@href">
						<xsl:value-of select="." />
						<xsl:if test="position() != last()"> , </xsl:if>
					</xsl:for-each>
				</xsl:when>
				<xsl:when test="count(item) >= $number">
					<xsl:value-of select="item[position() = $number]/@href" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="item[1]/@href" />
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<xsl:variable name="propertyElement" select="*[name(.) = $property]" />
			<xsl:choose>
				<xsl:when test="not($propertyElement/item)">
					<xsl:choose>
						<xsl:when test="$propertyElement = '' and $propertyElement/@href">
							<xsl:call-template name="lastURIpart">
								<xsl:with-param name="uri" select="$propertyElement/@href" />
							</xsl:call-template>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$propertyElement" />
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:when test="$number = 0">
					<xsl:for-each select="$propertyElement/item">
						<xsl:value-of select="." />
						<xsl:if test="position() != last()"> ; </xsl:if>
					</xsl:for-each>
				</xsl:when>
				<xsl:when test="count($propertyElement/item) >= $number">
					<xsl:value-of select="$propertyElement/item[position() = $number]" />
				</xsl:when>
				<xsl:when test="$propertyElement/item[1] = '' and $propertyElement/item[1]/@href">
					<xsl:call-template name="lastURIpart">
						<xsl:with-param name="uri" select="$propertyElement/item[1]/@href" />
					</xsl:call-template>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$propertyElement/item[1]" />
				</xsl:otherwise>
			</xsl:choose>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="contextLabel">
	<xsl:if test="not(parent::item/parent::items/parent::result or parent::primaryTopic/parent::result)">
		<xsl:apply-templates select="parent::*" mode="contextLabel" />
		<xsl:if test="not(self::item)"><xsl:text> > </xsl:text></xsl:if>
	</xsl:if>
	<xsl:if test="not(self::item)">
		<xsl:apply-templates select="." mode="label" />
	</xsl:if>
</xsl:template>

</xsl:stylesheet>