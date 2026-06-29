use std::collections::HashSet;

use super::types::{RackIpamAddress, RackItemMetadata};

fn trim_string(value: &mut Option<String>) {
    *value = value
        .as_ref()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
}

fn normalize_speed(value: &str) -> String {
    match value.trim().to_ascii_lowercase().as_str() {
        "1g" | "gigabit" => "gigabit".to_string(),
        "10g" => "10g".to_string(),
        "25g" => "25g".to_string(),
        "40g" => "40g".to_string(),
        "100g" => "100g".to_string(),
        _ => "custom".to_string(),
    }
}

fn normalize_ipam_address(mut address: RackIpamAddress) -> Option<RackIpamAddress> {
    address.address = address.address.trim().to_string();
    if address.address.is_empty() {
        return None;
    }
    address.family = match address.family.trim().to_ascii_lowercase().as_str() {
        "ipv6" => "ipv6".to_string(),
        _ => "ipv4".to_string(),
    };
    trim_string(&mut address.role);
    trim_string(&mut address.vlan);
    trim_string(&mut address.mac);
    Some(address)
}

pub fn normalize_metadata(mut metadata: RackItemMetadata) -> RackItemMetadata {
    trim_string(&mut metadata.accent);
    trim_string(&mut metadata.icon);
    trim_string(&mut metadata.notes);
    trim_string(&mut metadata.status);
    trim_string(&mut metadata.shell);
    trim_string(&mut metadata.expiry);
    trim_string(&mut metadata.vendor);
    if let Some(vendor) = metadata.vendor.as_mut() {
        *vendor = vendor.to_ascii_lowercase();
    }
    trim_string(&mut metadata.kuaiguai_size);

    if let Some(tags) = metadata.tags.take() {
        let tags = tags
            .into_iter()
            .map(|tag| tag.trim().to_string())
            .filter(|tag| !tag.is_empty())
            .collect::<Vec<_>>();
        metadata.tags = (!tags.is_empty()).then_some(tags);
    }

    if let Some(ids) = metadata.connection_ids.take() {
        let mut seen = HashSet::new();
        let ids = ids
            .into_iter()
            .map(|id| id.trim().to_string())
            .filter(|id| !id.is_empty() && seen.insert(id.clone()))
            .collect::<Vec<_>>();
        metadata.connection_ids = (!ids.is_empty()).then_some(ids);
    }

    if let Some(records) = metadata.audit_records.take() {
        let records = records
            .into_iter()
            .filter_map(|mut record| {
                record.label = record.label.trim().to_string();
                (!record.label.is_empty()).then_some(record)
            })
            .collect::<Vec<_>>();
        metadata.audit_records = (!records.is_empty()).then_some(records);
    }

    if let Some(ports) = metadata.network_ports.take() {
        let ports = ports
            .into_iter()
            .filter_map(|mut port| {
                port.name = port.name.trim().to_string();
                if port.name.is_empty() {
                    return None;
                }
                port.speed = normalize_speed(&port.speed);
                trim_string(&mut port.state);
                trim_string(&mut port.oid);
                trim_string(&mut port.note);
                Some(port)
            })
            .collect::<Vec<_>>();
        metadata.network_ports = (!ports.is_empty()).then_some(ports);
    }

    if let Some(mut relationship) = metadata.relationship.take() {
        relationship.label = relationship.label.trim().to_string();
        relationship.kind = relationship.kind.trim().to_string();
        metadata.relationship = (!relationship.label.is_empty()).then_some(relationship);
    }

    if let Some(mut snmp) = metadata.snmp.take() {
        snmp.target = snmp.target.trim().to_string();
        trim_string(&mut snmp.oid);
        trim_string(&mut snmp.community_secret_ref);
        trim_string(&mut snmp.last_refreshed_at);
        trim_string(&mut snmp.last_error);
        metadata.snmp = (!snmp.target.is_empty()).then_some(snmp);
    }

    if let Some(mut ipam) = metadata.ipam.take() {
        ipam.addresses = ipam
            .addresses
            .into_iter()
            .filter_map(normalize_ipam_address)
            .collect();
        metadata.ipam = (!ipam.addresses.is_empty()).then_some(ipam);
    }

    metadata
}

#[cfg(test)]
mod inventory_tests {
    use super::normalize_metadata;
    use crate::itops::types::RackItemMetadata;

    #[test]
    fn normalizes_legacy_rack_inventory_metadata() {
        let metadata: RackItemMetadata = serde_json::from_value(serde_json::json!({
            "tags": [" core ", "", "edge"],
            "auditRecords": ["上架 2026-06-29", "maintenance"],
            "connectionIds": ["conn-1", "conn-1", "conn-2"],
            "networkPorts": ["1:gigabit", "2:10g"],
            "snmp": "public@192.0.2.10:1.3.6.1.2.1.2",
            "relationship": "Host/VM",
            "vendor": "Dell"
        }))
        .expect("legacy metadata should deserialize");

        let normalized = normalize_metadata(metadata);

        assert_eq!(normalized.tags.unwrap(), vec!["core", "edge"]);
        assert_eq!(
            normalized
                .audit_records
                .unwrap()
                .into_iter()
                .map(|record| record.action)
                .collect::<Vec<_>>(),
            vec!["installed", "maintenance"]
        );
        assert_eq!(normalized.connection_ids.unwrap(), vec!["conn-1", "conn-2"]);
        assert_eq!(normalized.network_ports.unwrap()[1].speed, "10g");
        assert_eq!(normalized.snmp.unwrap().target, "192.0.2.10");
        assert_eq!(normalized.relationship.unwrap().kind, "hostVm");
        assert_eq!(normalized.vendor.unwrap(), "dell");
    }
}
